"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = exports.AppError = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
class AppError extends Error {
    statusCode;
    status;
    isOperational;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorMiddleware = (err, req, res, next) => {
    // Handle string errors by converting them to Error objects
    if (typeof err === "string") {
        err = new AppError(err, 500);
    }
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            status: "fail",
            message: "Validation Error",
            errors,
        });
    }
    // Handle Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            status: "fail",
            message: `${field} already exists`,
        });
    }
    // Handle Mongoose cast error (invalid ObjectId)
    if (err.name === "CastError") {
        return res.status(400).json({
            status: "fail",
            message: "Invalid ID format",
        });
    }
    // Handle Zod validation errors
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            status: "fail",
            message: "Validation Error",
            errors: err.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
            })),
        });
    }
    // Handle JWT errors
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            status: "fail",
            message: "Invalid token. Please log in again.",
        });
    }
    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            status: "fail",
            message: "Token expired. Please log in again.",
        });
    }
    if (process.env.NODE_ENV === "development") {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    }
    else {
        // Production: Don't leak error details
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }
        else {
            logger_1.logger.error("ERROR 💥", err);
            res.status(500).json({
                status: "error",
                message: "Something went very wrong!",
            });
        }
    }
};
exports.errorMiddleware = errorMiddleware;
//# sourceMappingURL=error.middleware.js.map