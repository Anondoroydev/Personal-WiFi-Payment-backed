import { Router } from "express";
import { Role } from "../../enums.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { roleMiddleware } from "../../middleware/role.middleware.js";
import { adminPaymentRouter } from "../payments/payment.routes.js";
import { userRouter } from "../users/user.routes.js";
import { authService } from "../auth/auth.service.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../middleware/error.middleware.js";
import { loginSchema } from "../auth/auth.controller.js";
import { setAuthCookie } from "../../utils/cookie.js";

export const adminRouter = Router();

adminRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const result = await authService.loginAdmin(body);
    setAuthCookie(res, result.token);
    sendSuccess(res, result, "Admin login successful");
  }),
);

adminRouter.use(authMiddleware, roleMiddleware(Role.ADMIN));

adminRouter.use("/payments", adminPaymentRouter);
adminRouter.use("/users", userRouter);
