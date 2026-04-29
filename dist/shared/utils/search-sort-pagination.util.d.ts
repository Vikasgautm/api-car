import { PaginationParams } from './pagination.util';
export interface SearchSortPaginationOptions {
    searchableFields?: string[];
    sortableFields?: string[];
    defaultSortBy?: string;
    defaultSortOrder?: 'asc' | 'desc';
    defaultLimit?: number;
    maxLimit?: number;
}
export interface SearchSortPaginationResult {
    filter: Record<string, unknown>;
    sort: Record<string, 1 | -1>;
    pagination: PaginationParams;
    search?: string;
}
export declare class SearchSortPaginationUtil {
    static parse(query: Record<string, unknown>, options?: SearchSortPaginationOptions): SearchSortPaginationResult;
    static parseWithSoftDelete(query: Record<string, unknown>, options?: SearchSortPaginationOptions, includeDeleted?: boolean): SearchSortPaginationResult;
    static parseWithPublished(query: Record<string, unknown>, options?: SearchSortPaginationOptions, publishedField?: string): SearchSortPaginationResult;
    static parseWithSoftDeleteAndPublished(query: Record<string, unknown>, options?: SearchSortPaginationOptions, includeDeleted?: boolean, publishedField?: string): SearchSortPaginationResult;
    static buildAggregatePipeline(query: Record<string, unknown>, options?: SearchSortPaginationOptions): any[];
    static buildAggregatePipelineWithCount(query: Record<string, unknown>, options?: SearchSortPaginationOptions): any[];
}
//# sourceMappingURL=search-sort-pagination.util.d.ts.map