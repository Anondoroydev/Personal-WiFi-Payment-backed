import { Request, Response, NextFunction } from "express";
import { Role } from "../enums.js";
import { AppError } from "../utils/error.js";

export function roleMiddleware(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError("Authentication required", 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError("Access denied", 403));
      return;
    }

    next();
  };
}
