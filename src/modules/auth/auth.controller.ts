import { z } from "zod";
import { authService } from "./auth.service.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../middleware/error.middleware.js";
import { setAuthCookie, clearAuthCookie } from "../../utils/cookie.js";
import { prisma } from "../../config/prisma.js";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().regex(/^01[3-9]\d{8}$/, "Invalid Bangladesh phone number"),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  phone: z.string().regex(/^01[3-9]\d{8}$/, "Invalid Bangladesh phone number"),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

const requestPasswordResetSchema = z.object({
  phone: z.string().regex(/^01[3-9]\d{8}$/, "Invalid Bangladesh phone number"),
});

const verifyPasswordResetSchema = requestPasswordResetSchema.extend({
  code: z.string().regex(/^\d{6}$/, "Reset code must be 6 digits"),
  newPassword: z.string().min(6),
});

export const authController = {
  register: asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const result = await authService.register(body);
    setAuthCookie(res, result.token);
    sendSuccess(res, result, "Registration successful", 201);
  }),

  login: asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body);
    setAuthCookie(res, result.token);
    sendSuccess(res, result, "Login successful");
  }),

  // Get current logged-in user info from cookie/token
  me: asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, phone: true, email: true, role: true, createdAt: true },
    });
    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }
    sendSuccess(res, { user }, "User info");
  }),

  logout: asyncHandler(async (_req, res) => {
    clearAuthCookie(res);
    sendSuccess(res, null, "Logged out");
  }),

  checkUser: asyncHandler(async (req, res) => {
    const result = await authService.checkUser(req.body.phone);
    sendSuccess(res, result, "Check complete");
  }),

  requestPasswordReset: asyncHandler(async (req, res) => {
    const { phone } = requestPasswordResetSchema.parse(req.body);
    await authService.requestPasswordReset(phone);
    sendSuccess(
      res,
      null,
      "If an account exists for that phone number, a reset code has been sent to its email.",
    );
  }),

  verifyPasswordReset: asyncHandler(async (req, res) => {
    const body = verifyPasswordResetSchema.parse(req.body);
    await authService.verifyPasswordReset(body.phone, body.code, body.newPassword);
    sendSuccess(res, null, "Password reset successful");
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const body = changePasswordSchema.parse(req.body);
    const result = await authService.changePassword(
      req.user!.userId,
      body.currentPassword,
      body.newPassword,
    );
    sendSuccess(res, result, "Password reset successful");
  }),
};
