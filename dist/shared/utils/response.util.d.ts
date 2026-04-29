import { Response } from 'express';
import { ErrorCode } from './app-error.util';
export declare class ResponseUtil {
    static success<T>(res: Response, data: T, message?: string, statusCode?: number): Response;
    static error(res: Response, message: string, statusCode?: number, code?: ErrorCode, errors?: any[]): Response;
    static paginated<T>(res: Response, data: T[], pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }, message?: string, statusCode?: number): Response;
    static created<T>(res: Response, data: T, message?: string): Response;
    static noContent(res: Response, message?: string): Response;
    static badRequest(res: Response, message?: string, code?: ErrorCode, errors?: any[]): Response;
    static unauthorized(res: Response, message?: string, code?: ErrorCode): Response;
    static forbidden(res: Response, message?: string, code?: ErrorCode): Response;
    static notFound(res: Response, message?: string, code?: ErrorCode): Response;
    static conflict(res: Response, message?: string, code?: ErrorCode): Response;
    static validationError(res: Response, message?: string, errors?: any[]): Response;
    static accepted<T>(res: Response, data: T, message?: string): Response;
    static updated<T>(res: Response, data: T, message?: string): Response;
    static deleted(res: Response, message?: string): Response;
}
//# sourceMappingURL=response.util.d.ts.map