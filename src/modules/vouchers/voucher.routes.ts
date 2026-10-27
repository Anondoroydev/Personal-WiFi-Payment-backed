import { Router } from "express";
import { Role } from "../../enums.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { roleMiddleware } from "../../middleware/role.middleware.js";
import { voucherController } from "./voucher.controller.js";

export const voucherRouter = Router();

// Public route to mark a voucher as used when logging in
voucherRouter.post("/use", voucherController.use);

voucherRouter.use(authMiddleware, roleMiddleware(Role.ADMIN));

voucherRouter.post("/upload", voucherController.upload);
voucherRouter.get("/stats", voucherController.stats);
voucherRouter.get("/", voucherController.list);
voucherRouter.delete("/all", voucherController.removeAll);
voucherRouter.delete("/:id", voucherController.remove);
