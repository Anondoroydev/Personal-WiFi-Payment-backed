import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/error.js";
import { Role } from "../enums.js";
import { COOKIE_NAME } from "../utils/cookie.js";

export interface AuthPayload {
  userId: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    // Try Authorization header first, then fall back to HttpOnly cookie
    let token: string | undefined;

    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      token = header.slice(7);
    } else if (req.cookies?.[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
    }

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new AppError("User not found", 401);
    }

    req.user = { userId: user.id, role: user.role as Role };
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Invalid or expired token", 401));
  }
}

export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    let token: string | undefined;

    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      token = header.slice(7);
    } else if (req.cookies?.[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
    }

    if (token) {
      const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, role: true },
      });
      if (user) {
        req.user = { userId: user.id, role: user.role as Role };
      }
    }
  } catch (_err) {
    // Ignore invalid token in optional auth middleware
  }
  next();
}
