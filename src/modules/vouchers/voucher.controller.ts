import { z } from "zod";
import { VoucherStatus } from "../../enums.js";
import { voucherService } from "./voucher.service.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

const singleVoucherSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  packageId: z.string().min(1),
});

const bulkUploadSchema = z.object({
  packageId: z.string().min(1),
  csv: z.string().min(1),
});

export const voucherController = {
  upload: asyncHandler(async (req, res) => {
    if (req.body.csv) {
      const body = bulkUploadSchema.parse(req.body);
      const result = await voucherService.bulkUpload(body.packageId, body.csv);
      sendSuccess(res, result, "Vouchers uploaded", 201);
      return;
    }

    const body = singleVoucherSchema.parse(req.body);
    const voucher = await voucherService.createSingle(body);
    sendSuccess(res, voucher, "Voucher created", 201);
  }),

  list: asyncHandler(async (req, res) => {
    const status = req.query.status as VoucherStatus | undefined;
    const packageId = req.query.packageId as string | undefined;
    const vouchers = await voucherService.list({ status, packageId });
    sendSuccess(res, vouchers);
  }),

  remove: asyncHandler(async (req, res) => {
    const result = await voucherService.deleteVoucher(String(req.params.id));
    sendSuccess(res, result, "Voucher deleted");
  }),

  removeAll: asyncHandler(async (_req, res) => {
    const result = await voucherService.deleteAll();
    sendSuccess(res, result, `Successfully deleted ${result.deleted} vouchers`);
  }),

  stats: asyncHandler(async (_req, res) => {
    const stats = await voucherService.getStats();
    sendSuccess(res, stats);
  }),

  use: asyncHandler(async (req, res) => {
    const { username, password } = z
      .object({ username: z.string().min(1), password: z.string().min(1) })
      .parse(req.body);
    const result = await voucherService.useVoucher(username, password);
    sendSuccess(res, result, "Voucher marked as used");
  }),
};
