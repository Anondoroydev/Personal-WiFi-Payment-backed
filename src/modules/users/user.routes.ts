import { Router } from "express";
import { userController } from "./user.controller.js";

export const userRouter = Router();

userRouter.get("/", userController.list);
userRouter.get("/:id", userController.getById);
userRouter.patch("/:id/reset-password", userController.resetPassword);
