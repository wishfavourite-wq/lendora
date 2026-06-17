import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/http.js";

export type RoleName = "admin" | "seller" | "customer";

export interface AuthUser {
  id: number;
  role: RoleName;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const header = request.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    request.user = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    return next();
  } catch {
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

export function allowRoles(...roles: RoleName[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return next(new ApiError(403, "You do not have permission for this action"));
    }
    return next();
  };
}
