import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { isAppError } from "../utils/error.js";
import { sendError } from "../utils/response.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return sendError(res, "Validation failed", 400, err.flatten());
  }

  if (isAppError(err)) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  // Send detailed error message temporarily to debug Vercel issue
  return sendError(res, err instanceof Error ? err.message : "Internal server error", 500);
}

export function asyncHandler<T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
