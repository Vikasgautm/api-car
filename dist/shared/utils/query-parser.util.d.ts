import { PaginationParams } from '../interfaces/pagination-response.interface';
export interface ParsedQuery {
    page: number;
    limit: number;
    skip: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    filters: Record<string, unknown>;
}
export declare const parseBool: (v: unknown) => boolean;
export declare class QueryParserUtil {
    static parsePagination(query: Record<string, unknown>): PaginationParams;
    static parseQuery(query: Record<string, unknown>): ParsedQuery;
    static parseNumericFilter(value: string | undefined): number | undefined;
    static parseBooleanFilter(value: string | undefined): boolean | undefined;
    static parseArrayFilter(value: string | undefined): string[] | undefined;
    static parseIdFilter(value: string | undefined): string | undefined;
    static parseDateFilter(value: string | undefined): Date | undefined;
    static parseObjectIdFilter(value: string | undefined): string | undefined;
    static parseRangeFilter(min: string | undefined, max: string | undefined): {
        min?: number;
        max?: number;
    } | undefined;
}
