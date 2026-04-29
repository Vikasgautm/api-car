import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/utils/app-error.util";
import { ResponseUtil } from "../shared/utils/response.util";
import { logger } from "../utils/logger";

// Re-export for backward compatibility
export { AppError, ErrorCode } from "../shared/utils/app-error.util";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Handle string errors by converting them to Error objects
  if (typeof err === "string") {
    err = AppError.internal(err);
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e: any) => e.message);
    return ResponseUtil.validationError(res, "Validation Error", errors);
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ResponseUtil.conflict(res, `${field} already exists`);
  }

  // Handle Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return ResponseUtil.badRequest(res, "Invalid ID format");
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue: any) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return ResponseUtil.validationError(res, "Validation Error", errors);
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return ResponseUtil.unauthorized(res, "Invalid token. Please log in again.");
  }

  if (err.name === "TokenExpiredError") {
    return ResponseUtil.unauthorized(res, "Token expired. Please log in again.");
  }

  // Handle AppError with errors array
  if (err instanceof AppError && err.errors) {
    return ResponseUtil.error(res, err.message, err.statusCode, err.code, err.errors);
  }

  if (process.env.NODE_ENV === "development") {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err,
      message: err.message,
      code: err.code,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    });
  } else {
    // Production: Don't leak error details
    if (err.isOperational) {
      ResponseUtil.error(res, err.message, err.statusCode, err.code);
    } else {
      logger.error("ERROR 💥", err);
      ResponseUtil.error(res, "Something went very wrong!", 500);
    }
  }
};
