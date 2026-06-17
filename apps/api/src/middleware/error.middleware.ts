import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/http.js";

export function notFound(request: Request, _response: Response, next: NextFunction) {
  next(new ApiError(404, `Route not found: ${request.method} ${request.originalUrl}`));
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return response.status(422).json({ success: false, message: "Validation failed", issues: error.flatten() });
  }

  if (error instanceof ApiError) {
    return response.status(error.status).json({ success: false, message: error.message });
  }

  console.error(error);
  return response.status(500).json({ success: false, message: "Unexpected server error" });
}
