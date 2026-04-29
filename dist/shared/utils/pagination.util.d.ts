import { PaginationMeta } from '../interfaces/pagination-response.interface';
export interface PaginationParams {
    skip: number;
    limit: number;
}
export interface PaginationOptions {
    page?: number;
    limit?: number;
    maxLimit?: number;
}
export declare class PaginationUtil {
    private static DEFAULT_LIMIT;
    private static DEFAULT_MAX_LIMIT;
    static getPaginationParams(page?: number, limit?: number, options?: PaginationOptions): PaginationParams;
    static createPaginationMeta(page: number, limit: number, total: number): PaginationMeta;
    static addSoftDeleteFilter<T extends Record<string, unknown>>(filter: T, field?: string, includeDeleted?: boolean): T;
    static addPublishedFilter<T extends Record<string, unknown>>(filter: T, field?: string, published?: boolean): T;
    static addFieldFilter<T extends Record<string, unknown>>(filter: T, field: string, value: unknown): T;
    static removeFieldFilter<T extends Record<string, unknown>>(filter: T, field: string): T;
    static addOnlyDeletedFilter<T extends Record<string, unknown>>(filter: T, field?: string): T;
}
//# sourceMappingURL=pagination.util.d.ts.map