import { Router } from "express";
import { packageController } from "./package.controller.js";

export const packageRouter = Router();

packageRouter.get("/", packageController.getAll);
