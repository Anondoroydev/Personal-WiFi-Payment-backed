import { Router } from "express";
import { authMiddleware, optionalAuthMiddleware } from "../../middleware/auth.middleware.js";
import {
  paymentController,
  adminPaymentController,
} from "./payment.controller.js";

export const paymentRouter = Router();

paymentRouter.post("/create", optionalAuthMiddleware, paymentController.create);
paymentRouter.get("/my", authMiddleware, paymentController.getMy);

export const adminPaymentRouter = Router();

adminPaymentRouter.get("/", adminPaymentController.list);
adminPaymentRouter.patch("/:id/approve", adminPaymentController.approve);
adminPaymentRouter.patch("/:id/reject", adminPaymentController.reject);
