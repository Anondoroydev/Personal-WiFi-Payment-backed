import { z } from "zod";
import { PaymentStatus } from "../../enums.js";
import { paymentService } from "./payment.service.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../middleware/error.middleware.js";
import { AppError } from "../../utils/error.js";

import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { Role } from "../../enums.js";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";

const createPaymentSchema = z.object({
  packageId: z.string().min(1),
  paymentMethod: z.string().min(1),
  transactionId: z.string().min(6),
  name: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export const paymentController = {
  create: asyncHandler(async (req, res) => {
    const body = createPaymentSchema.parse(req.body);
    // Require authenticated user — guest checkout is not allowed
    if (!req.user || !req.user.userId) {
      throw new AppError("Authentication required to create payment", 401);
    }

    const userId = req.user.userId;

    const payment = await paymentService.create({
      userId,
      packageId: body.packageId,
      paymentMethod: body.paymentMethod,
      transactionId: body.transactionId,
    });

    sendSuccess(res, payment, "Payment request submitted", 201);
  }),

  getMy: asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Authentication required", 401);
    const payments = await paymentService.getMyPayments(req.user.userId);
    sendSuccess(res, payments);
  }),
};

export const adminPaymentController = {
  list: asyncHandler(async (req, res) => {
    const status = req.query.status as PaymentStatus | undefined;
    const payments = await paymentService.getAllAdmin(status);
    sendSuccess(res, payments);
  }),

  approve: asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const result = await paymentService.approve(id);
    sendSuccess(res, result, "Payment approved and voucher assigned");
  }),

  reject: asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const payment = await paymentService.reject(id);
    sendSuccess(res, payment, "Payment rejected");
  }),
};
