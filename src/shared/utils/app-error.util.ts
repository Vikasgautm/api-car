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

  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  DUPLICATE_KEY = 'DUPLICATE_KEY',
  CAST_ERROR = 'CAST_ERROR',
  DOCUMENT_VALIDATION_FAILED = 'DOCUMENT_VALIDATION_FAILED',

  // Server
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // File Upload
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
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

export class AppError extends Error {
  public statusCode: number;
  public status: 'fail' | 'error';
  public isOperational: boolean;

  public code: ErrorCode;
  public errorCode: string;
  public userMessage: string;
  public details?: Record<string, any>;
  public errors?: any[];

  constructor(
    message: string,
    statusCode: number = 500,
    options: AppErrorOptions = {}
  ) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    this.code = options.code || (statusCode === 400 ? ErrorCode.VALIDATION_ERROR : ErrorCode.INTERNAL_ERROR);
    this.errorCode = options.errorCode || this.code;
    this.userMessage = options.userMessage || (statusCode === 400 ? message : AppError.getDefaultUserMessage(statusCode));
    this.details = options.details;
    this.errors = options.errors;

    Error.captureStackTrace(this, this.constructor);
  }

  private static getDefaultUserMessage(statusCode: number): string {
    if (statusCode === 400) return 'The request contains invalid data. Please check and try again.';
    if (statusCode === 401) return 'Your session is invalid or expired. Please login again.';
    if (statusCode === 403) return 'You do not have permission to perform this action.';
    if (statusCode === 404) return 'The requested data was not found.';
    if (statusCode === 409) return 'This data already exists or conflicts with another record.';
    if (statusCode >= 500) return 'Something went wrong on the server. Please try again later.';

    return 'Something went wrong. Please try again.';
  }

  /**
   * Use this when backend should log technical message,
   * but frontend should receive a simple user-friendly message.
   */
  static create(
    message: string,
    statusCode: number,
    options: AppErrorOptions = {}
  ): AppError {
    return new AppError(message, statusCode, options);
  }

  // -------------------------
  // Auth Errors
  // -------------------------

  static unauthorized(
    message: string = 'Unauthorized request',
    userMessage: string = 'Please login to continue.'
  ): AppError {
    return new AppError(message, 401, {
      code: ErrorCode.UNAUTHORIZED,
      errorCode: ErrorCode.UNAUTHORIZED,
      userMessage,
    });
  }

  static forbidden(
    message: string = 'Permission denied',
    userMessage: string = 'You do not have permission to perform this action.'
  ): AppError {
    return new AppError(message, 403, {
      code: ErrorCode.FORBIDDEN,
      errorCode: ErrorCode.FORBIDDEN,
      userMessage,
    });
  }

  static invalidCredentials(): AppError {
    return new AppError('Invalid email or password', 401, {
      code: ErrorCode.INVALID_CREDENTIALS,
      errorCode: ErrorCode.INVALID_CREDENTIALS,
      userMessage: 'Email or password is incorrect.',
    });
  }

  static tokenInvalid(): AppError {
    return new AppError('Invalid JWT token', 401, {
      code: ErrorCode.TOKEN_INVALID,
      errorCode: ErrorCode.TOKEN_INVALID,
      userMessage: 'Your login session is invalid. Please login again.',
    });
  }

  static tokenExpired(): AppError {
    return new AppError('JWT token expired', 401, {
      code: ErrorCode.TOKEN_EXPIRED,
      errorCode: ErrorCode.TOKEN_EXPIRED,
      userMessage: 'Your session has expired. Please login again.',
    });
  }

  // -------------------------
  // Validation Errors
  // -------------------------

  static badRequest(
    message: string = 'Bad request',
    userMessage: string = 'Invalid request data. Please check the form and try again.',
    errors?: any[]
  ): AppError {
    return new AppError(message, 400, {
      code: ErrorCode.INVALID_INPUT,
      errorCode: ErrorCode.INVALID_INPUT,
      userMessage,
      errors,
    });
  }

  static validation(
    message: string = 'Validation failed',
    errors?: any[],
    userMessage?: string
  ): AppError {
    return new AppError(message, 400, {
      code: ErrorCode.VALIDATION_ERROR,
      errorCode: ErrorCode.VALIDATION_ERROR,
      userMessage: userMessage || message,
      errors,
    });
  }

  static invalidId(
    fieldName: string = 'id',
    value?: string
  ): AppError {
    return new AppError(`Invalid ${fieldName} format${value ? `: ${value}` : ''}`, 400, {
      code: ErrorCode.INVALID_ID,
      errorCode: ErrorCode.INVALID_ID,
      userMessage: `Invalid ${fieldName}. Please select a valid record.`,
      details: {
        field: fieldName,
      },
    });
  }

  static invalidObjectId(
    fieldName: string = '_id',
    value?: string
  ): AppError {
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

  static notFound(
    resourceName: string = 'Data',
    lookupField?: string,
    lookupValue?: string
  ): AppError {
    return new AppError(
      `${resourceName} not found${lookupField ? ` for ${lookupField}: ${lookupValue}` : ''}`,
      404,
      {
        code: ErrorCode.NOT_FOUND,
        errorCode: `${resourceName.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`,
        userMessage: `${resourceName} was not found. It may have been deleted or is no longer available.`,
        details: {
          resource: resourceName,
          field: lookupField,
        },
      }
    );
  }

  static alreadyExists(
    resourceName: string = 'Data',
    fieldName?: string
  ): AppError {
    return new AppError(
      `${resourceName} already exists${fieldName ? ` with same ${fieldName}` : ''}`,
      409,
      {
        code: ErrorCode.ALREADY_EXISTS,
        errorCode: `${resourceName.toUpperCase().replace(/\s+/g, '_')}_ALREADY_EXISTS`,
        userMessage: `${resourceName} already exists${fieldName ? ` with this ${fieldName}` : ''}. Please use a different value.`,
        details: {
          resource: resourceName,
          field: fieldName,
        },
      }
    );
  }

  static conflict(
    message: string = 'Resource conflict',
    userMessage: string = 'This action conflicts with existing data. Please check and try again.'
  ): AppError {
    return new AppError(message, 409, {
      code: ErrorCode.CONFLICT,
      errorCode: ErrorCode.CONFLICT,
      userMessage,
    });
  }

  // -------------------------
  // Car Project Specific Errors
  // -------------------------

  static brandNotFound(brandId?: string): AppError {
    return new AppError(`Brand not found or deleted for brand_id: ${brandId}`, 404, {
      code: ErrorCode.NOT_FOUND,
      errorCode: 'BRAND_NOT_FOUND',
      userMessage: 'Selected brand was not found. Please choose a valid brand.',
      details: {
        field: 'brand_id',
      },
    });
  }

  static bodyTypeNotFound(bodyTypeId?: string): AppError {
    return new AppError(`Body type not found or deleted for body_type_id: ${bodyTypeId}`, 404, {
      code: ErrorCode.NOT_FOUND,
      errorCode: 'BODY_TYPE_NOT_FOUND',
      userMessage: 'Selected body type was not found. Please choose a valid body type.',
      details: {
        field: 'body_type_id',
      },
    });
  }

  static fuelTypeNotFound(fuelTypeId?: string): AppError {
    return new AppError(`Fuel type not found or deleted for fuel_type_id: ${fuelTypeId}`, 404, {
      code: ErrorCode.NOT_FOUND,
      errorCode: 'FUEL_TYPE_NOT_FOUND',
      userMessage: 'Selected fuel type was not found. Please choose a valid fuel type.',
      details: {
        field: 'fuel_type_id',
      },
    });
  }

  static carNotFound(carId?: string): AppError {
    return new AppError(`Car not found or deleted for car_id: ${carId}`, 404, {
      code: ErrorCode.NOT_FOUND,
      errorCode: 'CAR_NOT_FOUND',
      userMessage: 'Selected car was not found. It may have been deleted or unpublished.',
      details: {
        field: 'car_id',
      },
    });
  }

  static variantNotFound(variantId?: string): AppError {
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

  static database(
    message: string = 'Database operation failed',
    userMessage: string = 'Unable to process your request right now. Please try again later.'
  ): AppError {
    return new AppError(message, 500, {
      code: ErrorCode.DATABASE_ERROR,
      errorCode: ErrorCode.DATABASE_ERROR,
      userMessage,
    });
  }

  static duplicateKey(
    fieldName: string = 'field',
    resourceName: string = 'Data'
  ): AppError {
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

  static castError(
    fieldName: string = 'id',
    value?: string
  ): AppError {
    return new AppError(`Invalid value for ${fieldName}${value ? `: ${value}` : ''}`, 400, {
      code: ErrorCode.CAST_ERROR,
      errorCode: ErrorCode.CAST_ERROR,
      userMessage: `Invalid ${fieldName}. Please refresh the page and try again.`,
      details: {
        field: fieldName,
      },
    });
  }

  static mongooseValidation(errors?: any[]): AppError {
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

  static invalidFileType(
    allowedTypes?: string[]
  ): AppError {
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

  static fileTooLarge(maxSize?: string): AppError {
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

  static fileUploadFailed(): AppError {
    return new AppError('File upload failed', 500, {
      code: ErrorCode.FILE_UPLOAD_FAILED,
      errorCode: ErrorCode.FILE_UPLOAD_FAILED,
      userMessage: 'File upload failed. Please try again.',
    });
  }

  // -------------------------
  // Server Errors
  // -------------------------

  static internal(
    message: string = 'Internal server error',
    userMessage: string = 'Something went wrong on the server. Please try again later.'
  ): AppError {
    return new AppError(message, 500, {
      code: ErrorCode.INTERNAL_ERROR,
      errorCode: ErrorCode.INTERNAL_ERROR,
      userMessage,
    });
  }

  static serviceUnavailable(
    message: string = 'Service unavailable',
    userMessage: string = 'Service is temporarily unavailable. Please try again later.'
  ): AppError {
    return new AppError(message, 503, {
      code: ErrorCode.SERVICE_UNAVAILABLE,
      errorCode: ErrorCode.SERVICE_UNAVAILABLE,
      userMessage,
    });
  }
}