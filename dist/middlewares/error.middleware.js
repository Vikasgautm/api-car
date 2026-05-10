"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = exports.ErrorCode = exports.AppError = void 0;
const zod_1 = require("zod");
const app_error_util_1 = require("../shared/utils/app-error.util");
const response_util_1 = require("../shared/utils/response.util");
const logger_1 = require("../utils/logger");
// Re-export for backward compatibility
var app_error_util_2 = require("../shared/utils/app-error.util");
Object.defineProperty(exports, "AppError", { enumerable: true, get: function () { return app_error_util_2.AppError; } });
Object.defineProperty(exports, "ErrorCode", { enumerable: true, get: function () { return app_error_util_2.ErrorCode; } });
const errorMiddleware = (err, req, res, next) => {
    // Handle string errors by converting them to Error objects
    if (typeof err === "string") {
        err = app_error_util_1.AppError.internal(err);
    }
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map((e) => e.message);
        return response_util_1.ResponseUtil.validationError(res, "Validation Error", errors);
    }
    // Handle Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return response_util_1.ResponseUtil.conflict(res, `${field} already exists`);
    }
    // Handle Mongoose cast error (invalid ObjectId)
    if (err.name === "CastError") {
        return response_util_1.ResponseUtil.badRequest(res, "Invalid ID format");
    }
    // Handle Zod validation errors
    if (err instanceof zod_1.ZodError) {
        const errors = err.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
        }));
        return response_util_1.ResponseUtil.validationError(res, "Validation Error", errors);
    }
    // Handle JWT errors
    if (err.name === "JsonWebTokenError") {
        return response_util_1.ResponseUtil.unauthorized(res, "Invalid token. Please log in again.");
    }
    if (err.name === "TokenExpiredError") {
        return response_util_1.ResponseUtil.unauthorized(res, "Token expired. Please log in again.");
    }
    // Handle AppError with errors array
    if (err instanceof app_error_util_1.AppError && err.errors) {
        return response_util_1.ResponseUtil.error(res, err.userMessage || err.message, err.statusCode, err.errorCode || err.code, err.errors, err.details);
    }
    // Handle AppError with userMessage
    if (err instanceof app_error_util_1.AppError) {
        const response = {
            success: false,
            message: err.userMessage || err.message,
            statusCode: err.statusCode,
            timestamp: new Date().toISOString(),
        };
        if (err.errorCode) {
            response.errorCode = err.errorCode;
        }
        else if (err.code) {
            response.error = err.code;
        }
        if (err.details) {
            response.details = err.details;
        }
        // Log technical details for debugging
        logger_1.logger.error('API Error', {
            userMessage: err.userMessage,
            technicalMessage: err.message,
            errorCode: err.errorCode || err.code,
            statusCode: err.statusCode,
            details: err.details,
            route: req.originalUrl,
            method: req.method,
        });
        // Add debug info in development
        if (process.env.NODE_ENV === "development") {
            response.debug = {
                technicalMessage: err.message,
                stack: err.stack,
            };
        }
        return res.status(err.statusCode).json(response);
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
    }
    else {
        // Production: Don't leak error details
        if (err.isOperational) {
            response_util_1.ResponseUtil.error(res, err.message, err.statusCode, err.code);
        }
        else {
            logger_1.logger.error("ERROR 💥", err);
            response_util_1.ResponseUtil.error(res, "Something went very wrong!", 500);
        }
    }
};
exports.errorMiddleware = errorMiddleware;
//# sourceMappingURL=error.middleware.js.map