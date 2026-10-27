import { PaymentStatus, VoucherStatus } from "../../enums.js";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/error.js";

// MikroTik profile mapping for future integration
export const MIKROTIK_PROFILES: Record<string, string> = {
  "ডেইলি প্যাক": "1DAY",
  "সাপ্তাহিক প্যাক": "7DAY",
  "মাসিক প্যাক": "30DAY",
  "টিভি প্যাক": "TV-PACK-30DAY",

  // Backward compatibility for older database records created before the Bangla package names.
  "1 Day Pack": "1DAY",
  "7 Day Pack": "7DAY",
  "30 Day Pack": "30DAY",
  "30 Day TV Pack": "TV-PACK-30DAY",
};

async function assignVoucherWithLock(
  packageId: string,
  userId: string,
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
) {
  let availableVoucher = await tx.voucher.findFirst({
    where: {
      packageId: packageId,
      status: VoucherStatus.AVAILABLE,
      assignedUserId: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!availableVoucher) {
    // No available voucher for this package — do not auto-generate or assign from other packages.
    // Return a clear error so admin sees "no voucher stock" and can add vouchers or assign manually.
    throw new AppError('No available voucher for this package', 409);
  }

  return tx.voucher.update({
    where: { id: availableVoucher.id },
    data: {
      status: VoucherStatus.USED,
      assignedUserId: userId,
      usedAt: new Date(),
    },
    include: { package: true },
  });
}

export const paymentService = {
  async create(data: {
    userId: string;
    packageId: string;
    paymentMethod: string;
    transactionId: string;
  }) {
    const pkg = await prisma.package.findUnique({
      where: { id: data.packageId },
    });
    if (!pkg) throw new AppError("Package not found", 404);

    const duplicate = await prisma.paymentRequest.findFirst({
      where: {
        transactionId: data.transactionId,
        status: { not: PaymentStatus.REJECTED },
      },
    });
    if (duplicate) {
      throw new AppError("Transaction ID already used", 409);
    }

    return prisma.paymentRequest.create({
      data: {
        userId: data.userId,
        packageId: data.packageId,
        amount: pkg.price,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        status: PaymentStatus.PENDING,
      },
      include: {
        package: true,
        user: { select: { id: true, name: true, phone: true } },
      },
    });
  },

  async getMyPayments(userId: string) {
    return prisma.paymentRequest.findMany({
      where: { userId },
      include: {
        package: true,
        user: { select: { id: true, name: true, phone: true } },
        voucher: {
          select: {
            id: true,
            username: true,
            password: true,
            usedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getAllAdmin(status?: PaymentStatus) {
    // Only cleanup stale records when they actually exist.
    // Doing a full delete on every admin refresh makes SQLite reads slow and
    // causes the admin dashboard to feel delayed in production.
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const staleExists = await prisma.paymentRequest.findFirst({
      where: { createdAt: { lt: thirtyDaysAgo } },
      select: { id: true },
    });

    if (staleExists) {
      await prisma.paymentRequest.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      });
    }

    return prisma.paymentRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        package: true,
        user: { select: { id: true, name: true, phone: true, email: true } },
        voucher: {
          select: { id: true, username: true, password: true, usedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async approve(paymentId: string) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.paymentRequest.findUnique({
        where: { id: paymentId },
        include: { package: true, voucher: true },
      });

      if (!payment) throw new AppError("Payment not found", 404);
      if (payment.status !== PaymentStatus.PENDING) {
        throw new AppError("Payment is not pending", 400);
      }
      if (payment.voucherId) {
        throw new AppError("Payment already has a voucher assigned", 400);
      }

      const voucher = await assignVoucherWithLock(
        payment.packageId,
        payment.userId,
        tx,
      );

      const updatedPayment = await tx.paymentRequest.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.APPROVED,
          voucherId: voucher.id,
        },
        include: {
          package: true,
          user: { select: { id: true, name: true, phone: true } },
          voucher: true,
        },
      });

      // Future MikroTik integration hook
      const mikrotikProfile =
        MIKROTIK_PROFILES[payment.package.name] ?? "DEFAULT";

      return {
        payment: updatedPayment,
        mikrotik: {
          username: voucher.username,
          password: voucher.password,
          profile: mikrotikProfile,
        },
      };
    });
  },

  async reject(paymentId: string) {
    const payment = await prisma.paymentRequest.findUnique({
      where: { id: paymentId },
    });

    if (!payment) throw new AppError("Payment not found", 404);
    if (payment.status !== PaymentStatus.PENDING) {
      throw new AppError("Payment is not pending", 400);
    }

    return prisma.paymentRequest.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.REJECTED },
      include: {
        package: true,
        user: { select: { id: true, name: true, phone: true } },
      },
    });
  },
};
