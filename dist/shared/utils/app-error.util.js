"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.ErrorCode = void 0;
var ErrorCode;
(function (ErrorCode) {
    // Authentication & Authorization
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["TOKEN_INVALID"] = "TOKEN_INVALID";
    ErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    // Validation
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    ErrorCode["INVALID_ID"] = "INVALID_ID";
    ErrorCode["INVALID_EMAIL"] = "INVALID_EMAIL";
    ErrorCode["INVALID_URL"] = "INVALID_URL";
    ErrorCode["INVALID_OBJECT_ID"] = "INVALID_OBJECT_ID";
    // Resource
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["ALREADY_EXISTS"] = "ALREADY_EXISTS";
    ErrorCode["CONFLICT"] = "CONFLICT";
    ErrorCode["RESOURCE_LOCKED"] = "RESOURCE_LOCKED";
    // Business Logic
    ErrorCode["OPERATION_FAILED"] = "OPERATION_FAILED";
    ErrorCode["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
    ErrorCode["INVALID_STATE"] = "INVALID_STATE";
    // Server
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    // File Upload
    ErrorCode["INVALID_FILE_TYPE"] = "INVALID_FILE_TYPE";
    ErrorCode["FILE_TOO_LARGE"] = "FILE_TOO_LARGE";
    ErrorCode["FILE_UPLOAD_FAILED"] = "FILE_UPLOAD_FAILED";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
class AppError extends Error {
    statusCode;
    status;
    isOperational;
    errors;
    code;
    constructor(message, statusCode = 500, errors, code) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.errors = errors;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
    // Static factory methods for common errors
    static unauthorized(message = 'Unauthorized', code) {
        return new AppError(message, 401, undefined, code || ErrorCode.UNAUTHORIZED);
    }
    static forbidden(message = 'Forbidden', code) {
        return new AppError(message, 403, undefined, code || ErrorCode.FORBIDDEN);
    }
    static notFound(message = 'Resource not found', code) {
        return new AppError(message, 404, undefined, code || ErrorCode.NOT_FOUND);
    }
    static badRequest(message = 'Bad request', errors, code) {
        return new AppError(message, 400, errors, code || ErrorCode.INVALID_INPUT);
    }
    static conflict(message = 'Resource conflict', code) {
        return new AppError(message, 409, undefined, code || ErrorCode.CONFLICT);
    }
    static validation(message = 'Validation failed', errors) {
        return new AppError(message, 400, errors, ErrorCode.VALIDATION_ERROR);
    }
    static internal(message = 'Internal server error', code) {
        return new AppError(message, 500, undefined, code || ErrorCode.INTERNAL_ERROR);
    }
    static tokenInvalid(message = 'Invalid token') {
        return new AppError(message, 401, undefined, ErrorCode.TOKEN_INVALID);
    }
    static tokenExpired(message = 'Token expired') {
        return new AppError(message, 401, undefined, ErrorCode.TOKEN_EXPIRED);
    }
    static invalidId(message = 'Invalid ID format') {
        return new AppError(message, 400, undefined, ErrorCode.INVALID_ID);
    }
    static alreadyExists(message = 'Resource already exists') {
        return new AppError(message, 409, undefined, ErrorCode.ALREADY_EXISTS);
    }
    static invalidCredentials(message = 'Invalid credentials') {
        return new AppError(message, 401, undefined, ErrorCode.INVALID_CREDENTIALS);
    }
    static insufficientPermissions(message = 'Insufficient permissions') {
        return new AppError(message, 403, undefined, ErrorCode.INSUFFICIENT_PERMISSIONS);
    }
    static invalidFileType(message = 'Invalid file type') {
        return new AppError(message, 400, undefined, ErrorCode.INVALID_FILE_TYPE);
    }
    static fileTooLarge(message = 'File too large') {
        return new AppError(message, 400, undefined, ErrorCode.FILE_TOO_LARGE);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=app-error.util.js.map