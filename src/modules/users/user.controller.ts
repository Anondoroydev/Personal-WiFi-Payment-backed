import { z } from "zod";
import { userService } from "./user.service.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6),
});

export const userController = {
  list: asyncHandler(async (_req, res) => {
    const users = await userService.getAll();
    sendSuccess(res, users);
  }),

  getById: asyncHandler(async (req, res) => {
    const user = await userService.getById(String(req.params.id));
    sendSuccess(res, user);
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const { newPassword } = resetPasswordSchema.parse(req.body);
    const result = await userService.resetPassword(
      String(req.params.id),
      newPassword,
    );
    sendSuccess(res, result, "User password reset successful");
  }),
};
