import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { AppError, ErrorCode } from "../shared/utils/app-error.util";
import {
  getUserFriendlyMessage,
  normalizeErrors,
} from "../shared/utils/error-message.util";
import { ResponseUtil } from "../shared/utils/response.util";
import { logger } from "../utils/logger";

// Re-export for backward compatibility
export { AppError, ErrorCode } from "../shared/utils/app-error.util";

const isDev = process.env.NODE_ENV === "development";

/**
 * Attach development-only debug info (technical message + stack) to a response.
 */
function withDebug(response: Record<string, any>, err: any): Record<string, any> {
  if (isDev) {
    response.debug = {
      technicalMessage: err?.message,
      name: err?.name,
      stack: err?.stack,
    };
  }
  return response;
}

export const errorMiddleware = (
  err: any,
  req: Request,
  _res: Response,
  _next: NextFunction,
) => {
  const res = _res;

  // Normalize string throws into AppError
  if (typeof err === "string") {
    err = AppError.internal(err);
  }

  err.statusCode = err.statusCode || 500;

  // Always log technical details for debugging (never sent to the user)
  logger.error("API Error", {
    name: err.name,
    technicalMessage: err.message,
    errorCode: err.errorCode || err.code,
    statusCode: err.statusCode,
    route: req.originalUrl,
    method: req.method,
    ...(err.details ? { details: err.details } : {}),
  });

  // ---------------------------------------------------------------------------
  // Multer upload errors
  // ---------------------------------------------------------------------------
  if (err instanceof multer.MulterError || err.name === "MulterError") {
    const userMessage = getUserFriendlyMessage(err);
    const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const code =
      err.code === "LIMIT_FILE_SIZE"
        ? ErrorCode.FILE_TOO_LARGE
        : ErrorCode.INVALID_FILE_TYPE;
    return res.status(statusCode).json(
      withDebug(
        {
          success: false,
          message: userMessage,
          errorCode: code,
          error: code,
          errors: [userMessage],
          statusCode,
          timestamp: new Date().toISOString(),
          details: { multerCode: err.code, field: err.field },
        },
        err,
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Mongoose validation errors
  // ---------------------------------------------------------------------------
  if (err.name === "ValidationError" && err.errors) {
    const errors = normalizeErrors(err);
    const message = getUserFriendlyMessage(err);
    return ResponseUtil.error(
      res,
      message,
      400,
      ErrorCode.VALIDATION_ERROR,
      errors,
      isDev ? { technicalMessage: err.message } : undefined,
    );
  }

  // ---------------------------------------------------------------------------
  // Mongoose duplicate key error
  // ---------------------------------------------------------------------------
  if (err.code === 11000 || err.code === 11001) {
    const message = getUserFriendlyMessage(err);
    return ResponseUtil.error(res, message, 409, ErrorCode.DUPLICATE_KEY, [message]);
  }

  // ---------------------------------------------------------------------------
  // Mongoose cast error (invalid ObjectId / wrong type)
  // ---------------------------------------------------------------------------
  if (err.name === "CastError") {
    const message = "Invalid ID provided";
    return ResponseUtil.error(res, message, 400, ErrorCode.CAST_ERROR, [message]);
  }

  // ---------------------------------------------------------------------------
  // Zod validation errors
  // ---------------------------------------------------------------------------
  if (err instanceof ZodError) {
    const errors = normalizeErrors(err.issues);
    const message = errors[0] || "Some fields are invalid. Please check and try again.";
    return ResponseUtil.error(res, message, 400, ErrorCode.VALIDATION_ERROR, errors);
  }

  // ---------------------------------------------------------------------------
  // JWT errors
  // ---------------------------------------------------------------------------
  if (err.name === "TokenExpiredError") {
    return ResponseUtil.error(
      res,
      "Session expired. Please login again.",
      401,
      ErrorCode.TOKEN_EXPIRED,
    );
  }
  if (err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
    return ResponseUtil.error(
      res,
      "Invalid session. Please login again.",
      401,
      ErrorCode.TOKEN_INVALID,
    );
  }

  // ---------------------------------------------------------------------------
  // AppError (operational, carries user-friendly message + code)
  // ---------------------------------------------------------------------------
  if (err instanceof AppError) {
    const code = err.errorCode || err.code || ErrorCode.INTERNAL_ERROR;
    const errors = err.errors ? normalizeErrors(err.errors) : undefined;
    const isValidation =
      code === ErrorCode.VALIDATION_ERROR ||
      code === ErrorCode.DOCUMENT_VALIDATION_FAILED ||
      err.statusCode === 422;
    // For validation errors, surface the first clean field message as the
    // top-level message so clients reading only `message` still see it.
    const message =
      isValidation && errors && errors.length
        ? errors[0]
        : err.userMessage || getUserFriendlyMessage(err);
    return ResponseUtil.error(res, message, err.statusCode, code, errors, err.details);
  }

  // ---------------------------------------------------------------------------
  // Unknown / unexpected errors
  // ---------------------------------------------------------------------------
  const statusCode = err.statusCode >= 400 ? err.statusCode : 500;
  const message =
    statusCode < 500
      ? getUserFriendlyMessage(err)
      : "Something went wrong on the server. Please try again later.";

  if (statusCode >= 500) {
    logger.error("ERROR 💥", err);
  }

  return res.status(statusCode).json(
    withDebug(
      {
        success: false,
        message,
        errorCode: err.errorCode || err.code || ErrorCode.INTERNAL_ERROR,
        error: err.errorCode || err.code || ErrorCode.INTERNAL_ERROR,
        errors: err.errors ? normalizeErrors(err.errors) : [message],
        statusCode,
        timestamp: new Date().toISOString(),
        details: err.details || {},
      },
      err,
    ),
  );
};
