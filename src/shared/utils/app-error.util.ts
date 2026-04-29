export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_ID = 'INVALID_ID',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_URL = 'INVALID_URL',
  INVALID_OBJECT_ID = 'INVALID_OBJECT_ID',
  
  // Resource
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  
  // Business Logic
  OPERATION_FAILED = 'OPERATION_FAILED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  INVALID_STATE = 'INVALID_STATE',
  
  // Server
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // File Upload
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
}

export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  public errors?: any[];
  public code?: ErrorCode;

  constructor(
    message: string,
    statusCode: number = 500,
    errors?: any[],
    code?: ErrorCode
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }

  // Static factory methods for common errors
  static unauthorized(message: string = 'Unauthorized', code?: ErrorCode): AppError {
    return new AppError(message, 401, undefined, code || ErrorCode.UNAUTHORIZED);
  }

  static forbidden(message: string = 'Forbidden', code?: ErrorCode): AppError {
    return new AppError(message, 403, undefined, code || ErrorCode.FORBIDDEN);
  }

  static notFound(message: string = 'Resource not found', code?: ErrorCode): AppError {
    return new AppError(message, 404, undefined, code || ErrorCode.NOT_FOUND);
  }

  static badRequest(message: string = 'Bad request', errors?: any[], code?: ErrorCode): AppError {
    return new AppError(message, 400, errors, code || ErrorCode.INVALID_INPUT);
  }

  static conflict(message: string = 'Resource conflict', code?: ErrorCode): AppError {
    return new AppError(message, 409, undefined, code || ErrorCode.CONFLICT);
  }

  static validation(message: string = 'Validation failed', errors?: any[]): AppError {
    return new AppError(message, 400, errors, ErrorCode.VALIDATION_ERROR);
  }

  static internal(message: string = 'Internal server error', code?: ErrorCode): AppError {
    return new AppError(message, 500, undefined, code || ErrorCode.INTERNAL_ERROR);
  }

  static tokenInvalid(message: string = 'Invalid token'): AppError {
    return new AppError(message, 401, undefined, ErrorCode.TOKEN_INVALID);
  }

  static tokenExpired(message: string = 'Token expired'): AppError {
    return new AppError(message, 401, undefined, ErrorCode.TOKEN_EXPIRED);
  }

  static invalidId(message: string = 'Invalid ID format'): AppError {
    return new AppError(message, 400, undefined, ErrorCode.INVALID_ID);
  }

  static alreadyExists(message: string = 'Resource already exists'): AppError {
    return new AppError(message, 409, undefined, ErrorCode.ALREADY_EXISTS);
  }

  static invalidCredentials(message: string = 'Invalid credentials'): AppError {
    return new AppError(message, 401, undefined, ErrorCode.INVALID_CREDENTIALS);
  }

  static insufficientPermissions(message: string = 'Insufficient permissions'): AppError {
    return new AppError(message, 403, undefined, ErrorCode.INSUFFICIENT_PERMISSIONS);
  }

  static invalidFileType(message: string = 'Invalid file type'): AppError {
    return new AppError(message, 400, undefined, ErrorCode.INVALID_FILE_TYPE);
  }

  static fileTooLarge(message: string = 'File too large'): AppError {
    return new AppError(message, 400, undefined, ErrorCode.FILE_TOO_LARGE);
  }
}
