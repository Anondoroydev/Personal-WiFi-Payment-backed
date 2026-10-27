import { Router } from "express";
import { authController } from "./auth.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/check-user", authController.checkUser);
authRouter.post("/forgot-password", authController.requestPasswordReset);
authRouter.post("/verify-reset-otp", authController.verifyPasswordReset);
authRouter.post("/reset-password", authMiddleware, authController.resetPassword);
authRouter.get("/me", authMiddleware, authController.me);
authRouter.post("/logout", authController.logout);
