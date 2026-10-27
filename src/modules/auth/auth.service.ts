import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { Role } from "../../enums.js";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/error.js";
import { sendPasswordResetEmail } from "../../utils/mailer.js";

const resetCodeLifetimeMs = 10 * 60 * 1000;
const resetCodeCooldownMs = 60 * 1000;
const maxResetCodeAttempts = 5;

function hashResetCode(phone: string, code: string) {
  return createHmac("sha256", env.jwtSecret)
    .update(`${phone}:${code}`)
    .digest("hex");
}

function signToken(userId: string, role: Role) {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign({ userId, role }, env.jwtSecret, options);
}

function sanitizeUser(user: {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: Role;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export const authService = {
  async register(data: {
    name: string;
    email?: string;
    phone: string;
    password: string;
  }) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: data.phone },
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });

    if (existing) {
      throw new AppError("Phone or email already registered", 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: Role.USER,
      },
    });

    const token = signToken(user.id, user.role as Role);
    return { user: sanitizeUser({ ...user, role: user.role as Role }), token };
  },

  async login(data: { phone: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (!user) {
      throw new AppError("Invalid phone or password", 401);
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      throw new AppError("Invalid phone or password", 401);
    }

    const token = signToken(user.id, user.role as Role);
    return { user: sanitizeUser({ ...user, role: user.role as Role }), token };
  },

  async loginAdmin(data: { phone: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (!user || user.role !== Role.ADMIN) {
      throw new AppError("Invalid admin credentials", 401);
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) throw new AppError("Invalid admin credentials", 401);

    const token = signToken(user.id, user.role as Role);
    return { user: sanitizeUser({ ...user, role: user.role as Role }), token };
  },

  async checkUser(phone: string) {
    const user = await prisma.user.findUnique({
      where: { phone },
    });
    return { exists: !!user };
  },

  async requestPasswordReset(phone: string) {
    const existingCode = await prisma.passwordResetCode.findUnique({
      where: { phone },
    });
    const now = new Date();

    if (
      existingCode &&
      now.getTime() - existingCode.sentAt.getTime() < resetCodeCooldownMs
    ) {
      return;
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: { name: true, email: true },
    });
    if (!user?.email) return;

    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const codeHash = hashResetCode(phone, code);

    await prisma.passwordResetCode.upsert({
      where: { phone },
      update: {
        codeHash,
        expiresAt: new Date(now.getTime() + resetCodeLifetimeMs),
        sentAt: now,
        attempts: 0,
      },
      create: {
        phone,
        codeHash,
        expiresAt: new Date(now.getTime() + resetCodeLifetimeMs),
        sentAt: now,
      },
    });

    try {
      await sendPasswordResetEmail(user.email, user.name, code);
    } catch (error) {
      await prisma.passwordResetCode.deleteMany({
        where: { phone, codeHash },
      });
      throw error;
    }
  },

  async verifyPasswordReset(phone: string, code: string, newPassword: string) {
    const resetCode = await prisma.passwordResetCode.findUnique({
      where: { phone },
    });
    const now = new Date();

    if (!resetCode || resetCode.expiresAt <= now) {
      if (resetCode) {
        await prisma.passwordResetCode.deleteMany({
          where: { phone, codeHash: resetCode.codeHash },
        });
      }
      throw new AppError("Invalid or expired reset code", 400);
    }

    if (resetCode.attempts >= maxResetCodeAttempts) {
      throw new AppError("Too many reset code attempts", 429);
    }

    const attempt = await prisma.passwordResetCode.updateMany({
      where: {
        phone,
        codeHash: resetCode.codeHash,
        sentAt: resetCode.sentAt,
        expiresAt: { gt: now },
        attempts: { lt: maxResetCodeAttempts },
      },
      data: { attempts: { increment: 1 } },
    });
    if (attempt.count !== 1) {
      throw new AppError("Invalid or expired reset code", 400);
    }

    const submittedHash = hashResetCode(phone, code);
    const matches = timingSafeEqual(
      Buffer.from(submittedHash, "hex"),
      Buffer.from(resetCode.codeHash, "hex"),
    );
    if (!matches) {
      throw new AppError("Invalid or expired reset code", 400);
    }

    const password = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetCode.deleteMany({
        where: {
          phone,
          codeHash: resetCode.codeHash,
          expiresAt: { gt: new Date() },
        },
      });
      if (consumed.count !== 1) {
        throw new AppError("Invalid or expired reset code", 400);
      }

      await tx.user.update({
        where: { phone },
        data: { password },
      });
    });
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new AppError("Current password is incorrect", 401);

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { success: true };
  },
};
