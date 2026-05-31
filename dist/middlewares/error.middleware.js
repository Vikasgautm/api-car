"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = exports.ErrorCode = exports.AppError = void 0;
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const app_error_util_1 = require("../shared/utils/app-error.util");
const error_message_util_1 = require("../shared/utils/error-message.util");
const response_util_1 = require("../shared/utils/response.util");
const logger_1 = require("../utils/logger");
// Re-export for backward compatibility
var app_error_util_2 = require("../shared/utils/app-error.util");
Object.defineProperty(exports, "AppError", { enumerable: true, get: function () { return app_error_util_2.AppError; } });
Object.defineProperty(exports, "ErrorCode", { enumerable: true, get: function () { return app_error_util_2.ErrorCode; } });
const isDev = process.env.NODE_ENV === "development";
/**
 * Attach development-only debug info (technical message + stack) to a response.
 */
function withDebug(response, err) {
    if (isDev) {
        response.debug = {
            technicalMessage: err?.message,
            name: err?.name,
            stack: err?.stack,
        };
    }
    return response;
}
const errorMiddleware = (err, req, _res, _next) => {
    const res = _res;
    // Normalize string throws into AppError
    if (typeof err === "string") {
        err = app_error_util_1.AppError.internal(err);
    }
    err.statusCode = err.statusCode || 500;
    // Always log technical details for debugging (never sent to the user)
    logger_1.logger.error("API Error", {
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
    if (err instanceof multer_1.default.MulterError || err.name === "MulterError") {
        const userMessage = (0, error_message_util_1.getUserFriendlyMessage)(err);
        const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        const code = err.code === "LIMIT_FILE_SIZE"
            ? app_error_util_1.ErrorCode.FILE_TOO_LARGE
            : app_error_util_1.ErrorCode.INVALID_FILE_TYPE;
        return res.status(statusCode).json(withDebug({
            success: false,
            message: userMessage,
            errorCode: code,
            error: code,
            errors: [userMessage],
            statusCode,
            timestamp: new Date().toISOString(),
            details: { multerCode: err.code, field: err.field },
        }, err));
    }
    // ---------------------------------------------------------------------------
    // Mongoose validation errors
    // ---------------------------------------------------------------------------
    if (err.name === "ValidationError" && err.errors) {
        const errors = (0, error_message_util_1.normalizeErrors)(err);
        const message = (0, error_message_util_1.getUserFriendlyMessage)(err);
        return response_util_1.ResponseUtil.error(res, message, 400, app_error_util_1.ErrorCode.VALIDATION_ERROR, errors, isDev ? { technicalMessage: err.message } : undefined);
    }
    // ---------------------------------------------------------------------------
    // Mongoose duplicate key error
    // ---------------------------------------------------------------------------
    if (err.code === 11000 || err.code === 11001) {
        const message = (0, error_message_util_1.getUserFriendlyMessage)(err);
        return response_util_1.ResponseUtil.error(res, message, 409, app_error_util_1.ErrorCode.DUPLICATE_KEY, [message]);
    }
    // ---------------------------------------------------------------------------
    // Mongoose cast error (invalid ObjectId / wrong type)
    // ---------------------------------------------------------------------------
    if (err.name === "CastError") {
        const message = "Invalid ID provided";
        return response_util_1.ResponseUtil.error(res, message, 400, app_error_util_1.ErrorCode.CAST_ERROR, [message]);
    }
    // ---------------------------------------------------------------------------
    // Zod validation errors
    // ---------------------------------------------------------------------------
    if (err instanceof zod_1.ZodError) {
        const errors = (0, error_message_util_1.normalizeErrors)(err.issues);
        const message = errors[0] || "Some fields are invalid. Please check and try again.";
        return response_util_1.ResponseUtil.error(res, message, 400, app_error_util_1.ErrorCode.VALIDATION_ERROR, errors);
    }
    // ---------------------------------------------------------------------------
    // JWT errors
    // ---------------------------------------------------------------------------
    if (err.name === "TokenExpiredError") {
        return response_util_1.ResponseUtil.error(res, "Session expired. Please login again.", 401, app_error_util_1.ErrorCode.TOKEN_EXPIRED);
    }
    if (err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
        return response_util_1.ResponseUtil.error(res, "Invalid session. Please login again.", 401, app_error_util_1.ErrorCode.TOKEN_INVALID);
    }
    // ---------------------------------------------------------------------------
    // AppError (operational, carries user-friendly message + code)
    // ---------------------------------------------------------------------------
    if (err instanceof app_error_util_1.AppError) {
        const code = err.errorCode || err.code || app_error_util_1.ErrorCode.INTERNAL_ERROR;
        const errors = err.errors ? (0, error_message_util_1.normalizeErrors)(err.errors) : undefined;
        const isValidation = code === app_error_util_1.ErrorCode.VALIDATION_ERROR ||
            code === app_error_util_1.ErrorCode.DOCUMENT_VALIDATION_FAILED ||
            err.statusCode === 422;
        // For validation errors, surface the first clean field message as the
        // top-level message so clients reading only `message` still see it.
        const message = isValidation && errors && errors.length
            ? errors[0]
            : err.userMessage || (0, error_message_util_1.getUserFriendlyMessage)(err);
        return response_util_1.ResponseUtil.error(res, message, err.statusCode, code, errors, err.details);
    }
    // ---------------------------------------------------------------------------
    // Unknown / unexpected errors
    // ---------------------------------------------------------------------------
    const statusCode = err.statusCode >= 400 ? err.statusCode : 500;
    const message = statusCode < 500
        ? (0, error_message_util_1.getUserFriendlyMessage)(err)
        : "Something went wrong on the server. Please try again later.";
    if (statusCode >= 500) {
        logger_1.logger.error("ERROR 💥", err);
    }
    return res.status(statusCode).json(withDebug({
        success: false,
        message,
        errorCode: err.errorCode || err.code || app_error_util_1.ErrorCode.INTERNAL_ERROR,
        error: err.errorCode || err.code || app_error_util_1.ErrorCode.INTERNAL_ERROR,
        errors: err.errors ? (0, error_message_util_1.normalizeErrors)(err.errors) : [message],
        statusCode,
        timestamp: new Date().toISOString(),
        details: err.details || {},
    }, err));
};
exports.errorMiddleware = errorMiddleware;
//# sourceMappingURL=error.middleware.js.map