export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    /** Preferred stable, frontend-readable error code (e.g. VALIDATION_ERROR). */
    errorCode?: string;
    /** Legacy alias of `errorCode`, kept for backward compatibility. */
    error?: string;
    errors?: any[];
    details?: Record<string, any>;
    statusCode: number;
    timestamp: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
