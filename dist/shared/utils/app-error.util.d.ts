export declare enum ErrorCode {
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    TOKEN_INVALID = "TOKEN_INVALID",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INVALID_INPUT = "INVALID_INPUT",
    INVALID_ID = "INVALID_ID",
    INVALID_EMAIL = "INVALID_EMAIL",
    INVALID_URL = "INVALID_URL",
    INVALID_OBJECT_ID = "INVALID_OBJECT_ID",
    NOT_FOUND = "NOT_FOUND",
    ALREADY_EXISTS = "ALREADY_EXISTS",
    CONFLICT = "CONFLICT",
    RESOURCE_LOCKED = "RESOURCE_LOCKED",
    OPERATION_FAILED = "OPERATION_FAILED",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
    INVALID_STATE = "INVALID_STATE",
    DATABASE_ERROR = "DATABASE_ERROR",
    DUPLICATE_KEY = "DUPLICATE_KEY",
    CAST_ERROR = "CAST_ERROR",
    DOCUMENT_VALIDATION_FAILED = "DOCUMENT_VALIDATION_FAILED",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
    FILE_TOO_LARGE = "FILE_TOO_LARGE",
    FILE_UPLOAD_FAILED = "FILE_UPLOAD_FAILED"
}
export interface AppErrorOptions {
    /**
     * Message shown to frontend/user.
     * Example: "Selected brand was not found. Please choose a valid brand."
     */
    userMessage?: string;
    /**
     * Stable frontend-readable error code.
     * Example: BRAND_NOT_FOUND, BODY_TYPE_NOT_FOUND, DUPLICATE_SLUG
     */
    errorCode?: string;
    /**
     * Safe extra info for frontend.
     * Do not put stack trace, DB query, password, token, or secret here.
     */
    details?: Record<string, any>;
    /**
     * Validation errors array.
     */
    errors?: any[];
    /**
     * Internal error code enum.
     */
    code?: ErrorCode;
}
export declare class AppError extends Error {
    statusCode: number;
    status: 'fail' | 'error';
    isOperational: boolean;
    code: ErrorCode;
    errorCode: string;
    userMessage: string;
    details?: Record<string, any>;
    errors?: any[];
    constructor(message: string, statusCode?: number, options?: AppErrorOptions);
    private static getDefaultUserMessage;
    /**
     * Use this when backend should log technical message,
     * but frontend should receive a simple user-friendly message.
     */
    static create(message: string, statusCode: number, options?: AppErrorOptions): AppError;
    static unauthorized(message?: string, userMessage?: string): AppError;
    static forbidden(message?: string, userMessage?: string): AppError;
    static invalidCredentials(): AppError;
    static tokenInvalid(): AppError;
    static tokenExpired(): AppError;
    static badRequest(message?: string, userMessage?: string, errors?: any[]): AppError;
    static validation(message?: string, errors?: any[], userMessage?: string): AppError;
    static invalidId(fieldName?: string, value?: string): AppError;
    static invalidObjectId(fieldName?: string, value?: string): AppError;
    static notFound(resourceName?: string, lookupField?: string, lookupValue?: string): AppError;
    static alreadyExists(resourceName?: string, fieldName?: string): AppError;
    static conflict(message?: string, userMessage?: string): AppError;
    static brandNotFound(brandId?: string): AppError;
    static bodyTypeNotFound(bodyTypeId?: string): AppError;
    static fuelTypeNotFound(fuelTypeId?: string): AppError;
    static carNotFound(carId?: string): AppError;
    static variantNotFound(variantId?: string): AppError;
    static database(message?: string, userMessage?: string): AppError;
    static duplicateKey(fieldName?: string, resourceName?: string): AppError;
    static castError(fieldName?: string, value?: string): AppError;
    static mongooseValidation(errors?: any[]): AppError;
    static invalidFileType(allowedTypes?: string[]): AppError;
    static fileTooLarge(maxSize?: string): AppError;
    static fileUploadFailed(): AppError;
    static internal(message?: string, userMessage?: string): AppError;
    static serviceUnavailable(message?: string, userMessage?: string): AppError;
}
//# sourceMappingURL=app-error.util.d.ts.map