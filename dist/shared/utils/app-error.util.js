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
    // Database
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCode["DUPLICATE_KEY"] = "DUPLICATE_KEY";
    ErrorCode["CAST_ERROR"] = "CAST_ERROR";
    ErrorCode["DOCUMENT_VALIDATION_FAILED"] = "DOCUMENT_VALIDATION_FAILED";
    // Server
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    // File Upload
    ErrorCode["INVALID_FILE_TYPE"] = "INVALID_FILE_TYPE";
    ErrorCode["FILE_TOO_LARGE"] = "FILE_TOO_LARGE";
    ErrorCode["FILE_UPLOAD_FAILED"] = "FILE_UPLOAD_FAILED";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
class AppError extends Error {
    statusCode;
    status;
    isOperational;
    code;
    errorCode;
    userMessage;
    details;
    errors;
    constructor(message, statusCode = 500, options = {}) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.code = options.code || ErrorCode.INTERNAL_ERROR;
        this.errorCode = options.errorCode || this.code;
        this.userMessage = options.userMessage || AppError.getDefaultUserMessage(statusCode);
        this.details = options.details;
        this.errors = options.errors;
        Error.captureStackTrace(this, this.constructor);
    }
    static getDefaultUserMessage(statusCode) {
        if (statusCode === 400)
            return 'The request contains invalid data. Please check and try again.';
        if (statusCode === 401)
            return 'Your session is invalid or expired. Please login again.';
        if (statusCode === 403)
            return 'You do not have permission to perform this action.';
        if (statusCode === 404)
            return 'The requested data was not found.';
        if (statusCode === 409)
            return 'This data already exists or conflicts with another record.';
        if (statusCode >= 500)
            return 'Something went wrong on the server. Please try again later.';
        return 'Something went wrong. Please try again.';
    }
    /**
     * Use this when backend should log technical message,
     * but frontend should receive a simple user-friendly message.
     */
    static create(message, statusCode, options = {}) {
        return new AppError(message, statusCode, options);
    }
    // -------------------------
    // Auth Errors
    // -------------------------
    static unauthorized(message = 'Unauthorized request', userMessage = 'Please login to continue.') {
        return new AppError(message, 401, {
            code: ErrorCode.UNAUTHORIZED,
            errorCode: ErrorCode.UNAUTHORIZED,
            userMessage,
        });
    }
    static forbidden(message = 'Permission denied', userMessage = 'You do not have permission to perform this action.') {
        return new AppError(message, 403, {
            code: ErrorCode.FORBIDDEN,
            errorCode: ErrorCode.FORBIDDEN,
            userMessage,
        });
    }
    static invalidCredentials() {
        return new AppError('Invalid email or password', 401, {
            code: ErrorCode.INVALID_CREDENTIALS,
            errorCode: ErrorCode.INVALID_CREDENTIALS,
            userMessage: 'Email or password is incorrect.',
        });
    }
    static tokenInvalid() {
        return new AppError('Invalid JWT token', 401, {
            code: ErrorCode.TOKEN_INVALID,
            errorCode: ErrorCode.TOKEN_INVALID,
            userMessage: 'Your login session is invalid. Please login again.',
        });
    }
    static tokenExpired() {
        return new AppError('JWT token expired', 401, {
            code: ErrorCode.TOKEN_EXPIRED,
            errorCode: ErrorCode.TOKEN_EXPIRED,
            userMessage: 'Your session has expired. Please login again.',
        });
    }
    // -------------------------
    // Validation Errors
    // -------------------------
    static badRequest(message = 'Bad request', userMessage = 'Invalid request data. Please check the form and try again.', errors) {
        return new AppError(message, 400, {
            code: ErrorCode.INVALID_INPUT,
            errorCode: ErrorCode.INVALID_INPUT,
            userMessage,
            errors,
        });
    }
    static validation(message = 'Validation failed', errors, userMessage = 'Some fields are invalid. Please correct them and try again.') {
        return new AppError(message, 400, {
            code: ErrorCode.VALIDATION_ERROR,
            errorCode: ErrorCode.VALIDATION_ERROR,
            userMessage,
            errors,
        });
    }
    static invalidId(fieldName = 'id', value) {
        return new AppError(`Invalid ${fieldName} format${value ? `: ${value}` : ''}`, 400, {
            code: ErrorCode.INVALID_ID,
            errorCode: ErrorCode.INVALID_ID,
            userMessage: `Invalid ${fieldName}. Please select a valid record.`,
            details: {
                field: fieldName,
            },
        });
    }
    static invalidObjectId(fieldName = '_id', value) {
        return new AppError(`Invalid MongoDB ObjectId for ${fieldName}${value ? `: ${value}` : ''}`, 400, {
            code: ErrorCode.INVALID_OBJECT_ID,
            errorCode: ErrorCode.INVALID_OBJECT_ID,
            userMessage: `Invalid ${fieldName}. Please refresh the page and try again.`,
            details: {
                field: fieldName,
            },
        });
    }
    // -------------------------
    // Resource Errors
    // -------------------------
    static notFound(resourceName = 'Data', lookupField, lookupValue) {
        return new AppError(`${resourceName} not found${lookupField ? ` for ${lookupField}: ${lookupValue}` : ''}`, 404, {
            code: ErrorCode.NOT_FOUND,
            errorCode: `${resourceName.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`,
            userMessage: `${resourceName} was not found. It may have been deleted or is no longer available.`,
            details: {
                resource: resourceName,
                field: lookupField,
            },
        });
    }
    static alreadyExists(resourceName = 'Data', fieldName) {
        return new AppError(`${resourceName} already exists${fieldName ? ` with same ${fieldName}` : ''}`, 409, {
            code: ErrorCode.ALREADY_EXISTS,
            errorCode: `${resourceName.toUpperCase().replace(/\s+/g, '_')}_ALREADY_EXISTS`,
            userMessage: `${resourceName} already exists${fieldName ? ` with this ${fieldName}` : ''}. Please use a different value.`,
            details: {
                resource: resourceName,
                field: fieldName,
            },
        });
    }
    static conflict(message = 'Resource conflict', userMessage = 'This action conflicts with existing data. Please check and try again.') {
        return new AppError(message, 409, {
            code: ErrorCode.CONFLICT,
            errorCode: ErrorCode.CONFLICT,
            userMessage,
        });
    }
    // -------------------------
    // Car Project Specific Errors
    // -------------------------
    static brandNotFound(brandId) {
        return new AppError(`Brand not found or deleted for brand_id: ${brandId}`, 404, {
            code: ErrorCode.NOT_FOUND,
            errorCode: 'BRAND_NOT_FOUND',
            userMessage: 'Selected brand was not found. Please choose a valid brand.',
            details: {
                field: 'brand_id',
            },
        });
    }
    static bodyTypeNotFound(bodyTypeId) {
        return new AppError(`Body type not found or deleted for body_type_id: ${bodyTypeId}`, 404, {
            code: ErrorCode.NOT_FOUND,
            errorCode: 'BODY_TYPE_NOT_FOUND',
            userMessage: 'Selected body type was not found. Please choose a valid body type.',
            details: {
                field: 'body_type_id',
            },
        });
    }
    static fuelTypeNotFound(fuelTypeId) {
        return new AppError(`Fuel type not found or deleted for fuel_type_id: ${fuelTypeId}`, 404, {
            code: ErrorCode.NOT_FOUND,
            errorCode: 'FUEL_TYPE_NOT_FOUND',
            userMessage: 'Selected fuel type was not found. Please choose a valid fuel type.',
            details: {
                field: 'fuel_type_id',
            },
        });
    }
    static carNotFound(carId) {
        return new AppError(`Car not found or deleted for car_id: ${carId}`, 404, {
            code: ErrorCode.NOT_FOUND,
            errorCode: 'CAR_NOT_FOUND',
            userMessage: 'Selected car was not found. It may have been deleted or unpublished.',
            details: {
                field: 'car_id',
            },
        });
    }
    static variantNotFound(variantId) {
        return new AppError(`Variant not found or deleted for variant_id: ${variantId}`, 404, {
            code: ErrorCode.NOT_FOUND,
            errorCode: 'VARIANT_NOT_FOUND',
            userMessage: 'Selected variant was not found. It may have been deleted or is no longer available.',
            details: {
                field: 'variant_id',
            },
        });
    }
    // -------------------------
    // MongoDB / Mongoose Errors
    // -------------------------
    static database(message = 'Database operation failed', userMessage = 'Unable to process your request right now. Please try again later.') {
        return new AppError(message, 500, {
            code: ErrorCode.DATABASE_ERROR,
            errorCode: ErrorCode.DATABASE_ERROR,
            userMessage,
        });
    }
    static duplicateKey(fieldName = 'field', resourceName = 'Data') {
        return new AppError(`Duplicate key error on ${resourceName}.${fieldName}`, 409, {
            code: ErrorCode.DUPLICATE_KEY,
            errorCode: 'DUPLICATE_KEY',
            userMessage: `${resourceName} with this ${fieldName} already exists. Please use a different value.`,
            details: {
                resource: resourceName,
                field: fieldName,
            },
        });
    }
    static castError(fieldName = 'id', value) {
        return new AppError(`Invalid value for ${fieldName}${value ? `: ${value}` : ''}`, 400, {
            code: ErrorCode.CAST_ERROR,
            errorCode: ErrorCode.CAST_ERROR,
            userMessage: `Invalid ${fieldName}. Please refresh the page and try again.`,
            details: {
                field: fieldName,
            },
        });
    }
    static mongooseValidation(errors) {
        return new AppError('Mongoose document validation failed', 400, {
            code: ErrorCode.DOCUMENT_VALIDATION_FAILED,
            errorCode: ErrorCode.DOCUMENT_VALIDATION_FAILED,
            userMessage: 'Some saved data is invalid. Please check all required fields and try again.',
            errors,
        });
    }
    // -------------------------
    // File Upload Errors
    // -------------------------
    static invalidFileType(allowedTypes) {
        return new AppError('Invalid file type uploaded', 400, {
            code: ErrorCode.INVALID_FILE_TYPE,
            errorCode: ErrorCode.INVALID_FILE_TYPE,
            userMessage: allowedTypes?.length
                ? `Invalid file type. Please upload only: ${allowedTypes.join(', ')}.`
                : 'Invalid file type. Please upload a supported file.',
            details: {
                allowedTypes,
            },
        });
    }
    static fileTooLarge(maxSize) {
        return new AppError('Uploaded file is too large', 400, {
            code: ErrorCode.FILE_TOO_LARGE,
            errorCode: ErrorCode.FILE_TOO_LARGE,
            userMessage: maxSize
                ? `File is too large. Maximum allowed size is ${maxSize}.`
                : 'File is too large. Please upload a smaller file.',
            details: {
                maxSize,
            },
        });
    }
    static fileUploadFailed() {
        return new AppError('File upload failed', 500, {
            code: ErrorCode.FILE_UPLOAD_FAILED,
            errorCode: ErrorCode.FILE_UPLOAD_FAILED,
            userMessage: 'File upload failed. Please try again.',
        });
    }
    // -------------------------
    // Server Errors
    // -------------------------
    static internal(message = 'Internal server error', userMessage = 'Something went wrong on the server. Please try again later.') {
        return new AppError(message, 500, {
            code: ErrorCode.INTERNAL_ERROR,
            errorCode: ErrorCode.INTERNAL_ERROR,
            userMessage,
        });
    }
    static serviceUnavailable(message = 'Service unavailable', userMessage = 'Service is temporarily unavailable. Please try again later.') {
        return new AppError(message, 503, {
            code: ErrorCode.SERVICE_UNAVAILABLE,
            errorCode: ErrorCode.SERVICE_UNAVAILABLE,
            userMessage,
        });
    }
}
exports.AppError = AppError;
//# sourceMappingURL=app-error.util.js.map