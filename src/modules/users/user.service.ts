import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/error.js";

export const userService = {
  async getAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: { payments: true, assignedVouchers: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        payments: {
          include: {
            package: true,
            voucher: {
              select: { username: true, password: true, usedAt: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) throw new AppError("User not found", 404);
    return user;
  },

  async resetPassword(id: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, phone: true },
    });

    if (!user) throw new AppError("User not found", 404);

    const password = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password },
      }),
      prisma.passwordResetCode.deleteMany({
        where: { phone: user.phone },
      }),
    ]);

    return { success: true };
  },
};
