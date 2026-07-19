export declare class FilterUtil {
    static escapeRegExp(str: string): string;
    static buildSearchFilter(fields: string[], searchTerm: string): Record<string, unknown>;
    static mergeFilterWithOr(filter: Record<string, any>, searchFilter: Record<string, any>): Record<string, any>;
    static buildSortFilter(sortBy: string, sortOrder?: 'asc' | 'desc'): Record<string, 1 | -1>;
    static buildDateRangeFilter(field: string, startDate?: Date, endDate?: Date): Record<string, unknown>;
    static buildArrayFilter<T>(field: string, values: T[]): Record<string, unknown>;
    static buildObjectIdFilter(field: string, value: string | undefined): Record<string, unknown>;
    static buildNumericRangeFilter(field: string, min?: number, max?: number): Record<string, unknown>;
    static buildBooleanFilter(field: string, value: boolean | undefined): Record<string, unknown>;
    static buildEnumFilter<T extends string>(field: string, value: T | undefined): Record<string, unknown>;
}
