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
    INTERNAL_ERROR = "INTERNAL_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    DATABASE_ERROR = "DATABASE_ERROR",
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
    FILE_TOO_LARGE = "FILE_TOO_LARGE",
    FILE_UPLOAD_FAILED = "FILE_UPLOAD_FAILED"
}
export declare class AppError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;
    errors?: any[];
    code?: ErrorCode;
    constructor(message: string, statusCode?: number, errors?: any[], code?: ErrorCode);
    static unauthorized(message?: string, code?: ErrorCode): AppError;
    static forbidden(message?: string, code?: ErrorCode): AppError;
    static notFound(message?: string, code?: ErrorCode): AppError;
    static badRequest(message?: string, errors?: any[], code?: ErrorCode): AppError;
    static conflict(message?: string, code?: ErrorCode): AppError;
    static validation(message?: string, errors?: any[]): AppError;
    static internal(message?: string, code?: ErrorCode): AppError;
    static tokenInvalid(message?: string): AppError;
    static tokenExpired(message?: string): AppError;
    static invalidId(message?: string): AppError;
    static alreadyExists(message?: string): AppError;
    static invalidCredentials(message?: string): AppError;
    static insufficientPermissions(message?: string): AppError;
    static invalidFileType(message?: string): AppError;
    static fileTooLarge(message?: string): AppError;
}
//# sourceMappingURL=app-error.util.d.ts.map