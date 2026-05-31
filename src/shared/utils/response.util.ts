import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../interfaces/api-response.interface';
import { ErrorCode } from './app-error.util';

export class ResponseUtil {
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      statusCode,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    code?: ErrorCode | string,
    errors?: any[],
    details?: Record<string, any>
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      // Provide both keys for backward compatibility.
      // Frontend should prefer `errorCode`; `error` is the legacy alias.
      errorCode: code,
      error: code,
      errors: errors || [],
      statusCode,
      timestamp: new Date().toISOString(),
      details: details || {},
    };

    return res.status(statusCode).json(response);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    },
    message: string = 'Success',
    statusCode: number = 200
  ): Response {
    const response: PaginatedResponse<T> = {
      data,
      pagination,
    };
    return ResponseUtil.success(res, response, message, statusCode);
  }

  static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully'
  ): Response {
    return ResponseUtil.success(res, data, message, 201);
  }

  static noContent(res: Response, message: string = 'Success'): Response {
    return ResponseUtil.success(res, null, message, 204);
  }

  static badRequest(
    res: Response,
    message: string = 'Bad request',
    code?: ErrorCode,
    errors?: any[]
  ): Response {
    return ResponseUtil.error(res, message, 400, code || ErrorCode.INVALID_INPUT, errors);
  }

  static unauthorized(
    res: Response,
    message: string = 'Unauthorized',
    code?: ErrorCode
  ): Response {
    return ResponseUtil.error(res, message, 401, code || ErrorCode.UNAUTHORIZED);
  }

  static forbidden(
    res: Response,
    message: string = 'Forbidden',
    code?: ErrorCode
  ): Response {
    return ResponseUtil.error(res, message, 403, code || ErrorCode.FORBIDDEN);
  }

  static notFound(
    res: Response,
    message: string = 'Resource not found',
    code?: ErrorCode
  ): Response {
    return ResponseUtil.error(res, message, 404, code || ErrorCode.NOT_FOUND);
  }

  static conflict(
    res: Response,
    message: string = 'Resource conflict',
    code?: ErrorCode
  ): Response {
    return ResponseUtil.error(res, message, 409, code || ErrorCode.CONFLICT);
  }

  static validationError(
    res: Response,
    message: string = 'Validation failed',
    errors?: any[]
  ): Response {
    return ResponseUtil.error(res, message, 400, ErrorCode.VALIDATION_ERROR, errors);
  }

  static accepted<T>(
    res: Response,
    data: T,
    message: string = 'Request accepted'
  ): Response {
    return ResponseUtil.success(res, data, message, 202);
  }

  static updated<T>(
    res: Response,
    data: T,
    message: string = 'Resource updated successfully'
  ): Response {
    return ResponseUtil.success(res, data, message, 200);
  }

  static deleted(
    res: Response,
    message: string = 'Resource deleted successfully'
  ): Response {
    return ResponseUtil.success(res, null, message, 200);
  }
}
