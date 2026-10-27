import { VoucherStatus } from "../../enums.js";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/error.js";

function parseCsv(content: string): { username: string; password: string }[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("---"));

  if (lines.length === 0) return [];

  const rows: { username: string; password: string }[] = [];
  const firstLineLower = lines[0].toLowerCase();
  const hasHeader =
    (firstLineLower.includes("username") || firstLineLower.includes("user")) &&
    (firstLineLower.includes("password") || firstLineLower.includes("pass"));

  const startIndex = hasHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // Split by comma, semicolon, tab, pipe, colon, or whitespace
    const parts = line.split(/[,;\t|:\s]+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      rows.push({ username: parts[0], password: parts[1] });
    }
  }

  return rows;
}

export const voucherService = {
  async createSingle(data: {
    username: string;
    password: string;
    packageId: string;
  }) {
    const pkg = await prisma.package.findUnique({
      where: { id: data.packageId },
    });
    if (!pkg) throw new AppError("Package not found", 404);

    return prisma.voucher.upsert({
      where: {
        username_packageId: {
          username: data.username,
          packageId: data.packageId,
        },
      },
      update: {
        password: data.password,
        status: VoucherStatus.AVAILABLE,
        assignedUserId: null,
        usedAt: null,
      },
      create: {
        username: data.username,
        password: data.password,
        packageId: data.packageId,
        status: VoucherStatus.AVAILABLE,
      },
      include: { package: true },
    });
  },

  async bulkUpload(packageId: string, csvContent: string) {
    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) throw new AppError("Package not found", 404);

    const rows = parseCsv(csvContent);
    if (rows.length === 0) {
      throw new AppError("No valid voucher rows found in CSV", 400);
    }

    let count = 0;
    for (const row of rows) {
      try {
        await prisma.voucher.upsert({
          where: {
            username_packageId: {
              username: row.username,
              packageId: packageId,
            },
          },
          update: {
            password: row.password,
            status: VoucherStatus.AVAILABLE,
            assignedUserId: null,
            usedAt: null,
          },
          create: {
            username: row.username,
            password: row.password,
            packageId: packageId,
            status: VoucherStatus.AVAILABLE,
          },
        });
        count++;
      } catch (_err) {
        // Ignore per-row insert errors while continuing to process the batch.
      }
    }

    return { created: count, total: rows.length };
  },

  async list(filters: { status?: VoucherStatus; packageId?: string }) {
    return prisma.voucher.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.packageId ? { packageId: filters.packageId } : {}),
      },
      include: {
        package: { select: { id: true, name: true, type: true } },
        assignedUser: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async deleteVoucher(id: string) {
    const voucher = await prisma.voucher.findUnique({ where: { id } });
    if (!voucher) throw new AppError("Voucher not found", 404);

    // 1. Disconnect any linked payment requests
    await prisma.paymentRequest.updateMany({
      where: { voucherId: id },
      data: { voucherId: null },
    });

    // 2. Unassign user and clear usedAt metadata if assigned
    await prisma.voucher.update({
      where: { id },
      data: {
        assignedUserId: null,
        usedAt: null,
      },
    });

    // 3. Delete the voucher
    await prisma.voucher.delete({ where: { id } });
    return { deleted: true };
  },

  async deleteAll() {
    // 1. Disconnect all voucher links from payment requests
    await prisma.paymentRequest.updateMany({
      where: { voucherId: { not: null } },
      data: { voucherId: null },
    });

    // 2. Clear assigned users on all vouchers
    await prisma.voucher.updateMany({
      data: {
        assignedUserId: null,
        usedAt: null,
      },
    });

    // 3. Delete all vouchers
    const result = await prisma.voucher.deleteMany({});
    return { deleted: result.count };
  },

  async getStats() {
    const [available, used] = await Promise.all([
      prisma.voucher.count({ where: { status: VoucherStatus.AVAILABLE } }),
      prisma.voucher.count({ where: { status: VoucherStatus.USED } }),
    ]);
    return { available, used };
  },

  async useVoucher(username: string, password: string) {
    const voucher = await prisma.voucher.findFirst({
      where: { username, password },
    });
    if (!voucher) throw new AppError("Invalid voucher credentials", 401);

    return prisma.voucher.update({
      where: { id: voucher.id },
      data: {
        status: VoucherStatus.USED,
        usedAt: new Date(),
      },
    });
  },
};
