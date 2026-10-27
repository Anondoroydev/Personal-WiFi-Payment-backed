import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { packageRouter } from "./modules/packages/package.routes.js";
import { paymentRouter } from "./modules/payments/payment.routes.js";
import { voucherRouter } from "./modules/vouchers/voucher.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import announcementRouter from "./modules/announcements/announcement.routes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        const isAllowed =
          !origin ||
          env.corsOrigins.includes("*") ||
          env.corsOrigins.includes(origin);
        callback(null, isAllowed);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, message: "WiFi Voucher API is running" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/packages", packageRouter);
  app.use("/api/payments", paymentRouter);
  app.use("/api/vouchers", voucherRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/announcements", announcementRouter);

  app.use(errorHandler);

  return app;
}
