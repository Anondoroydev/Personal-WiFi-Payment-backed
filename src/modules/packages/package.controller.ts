import { packageService } from "./package.service.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const packageController = {
  getAll: asyncHandler(async (_req, res) => {
    const packages = await packageService.getAll();
    sendSuccess(res, packages);
  }),
};
