import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import { ZodError } from "zod";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;
  // Admin metrics get the real message even when the client only sees a generic one.
  let internalMessage: string | undefined;

  if (error instanceof ZodError) {
    const message = "Validation Error";
    const errors = error.issues.map(( e) => ({
      path: e.path.join("."),
      message: e.message,
    }));
    error = new ApiError(400, message, errors);
  } else if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    // Unexpected errors (DB, SDKs) can carry internals; log them, send a generic message.
    if (statusCode >= 500) {
      console.error(err);
      internalMessage = error.message;
    }
    const message = statusCode >= 500 ? "Internal Server Error" : error.message || "Request failed";
    error = new ApiError(statusCode, message, [], err.stack);
  }

  // Picked up by metricsMiddleware so per-endpoint stats show what failed.
  res.locals.errorMessage = internalMessage || error.message;

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    // Both must agree it's a dev box: a missing/mistyped ENVIRONMENT never leaks stacks in prod.
    ...(process.env.ENVIRONMENT === "development" && process.env.NODE_ENV !== "production" ? { stack: error.stack } : {}),
  };

  res.status(error.statusCode).json(response);
};
