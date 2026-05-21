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

export const parseBool = (v: unknown): boolean => v === 'true' || v === true;

export class QueryParserUtil {
  static parsePagination(query: Record<string, unknown>): PaginationParams {
    const page = Math.max(1, parseInt((query.page as string) || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt((query.limit as string) || '10', 10)));
    const sortBy = (query.sortBy as string) || 'createdAt';
    const sortOrder = (query.sortOrder as 'asc' | 'desc') || 'desc';

    return { page, limit, sortBy, sortOrder };
  }

  static parseQuery(query: Record<string, unknown>): ParsedQuery {
    const pagination = this.parsePagination(query);
    const search = query.search as string | undefined;
    
    const filters: Record<string, unknown> = {};
    const reservedKeys = ['page', 'limit', 'sortBy', 'sortOrder', 'search', 'q'];
    
    for (const [key, value] of Object.entries(query)) {
      if (!reservedKeys.includes(key) && value !== undefined && value !== null && value !== '') {
        filters[key] = value;
      }
    }

    // Also check for 'q' as search parameter
    const searchTerm = search || (query.q as string | undefined);
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    return {
      page,
      limit,
      skip,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
      search: searchTerm,
      filters,
    };
  }

  static parseNumericFilter(
    value: string | undefined
  ): number | undefined {
    if (!value) return undefined;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }

  static parseBooleanFilter(
    value: string | undefined
  ): boolean | undefined {
    if (!value) return undefined;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return undefined;
  }

  static parseArrayFilter(
    value: string | undefined
  ): string[] | undefined {
    if (!value) return undefined;
    return value.split(',').map((v) => v.trim()).filter((v) => v.length > 0);
  }

  static parseIdFilter(
    value: string | undefined
  ): string | undefined {
    if (!value) return undefined;
    return value.trim();
  }

  static parseDateFilter(
    value: string | undefined
  ): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }

  static parseObjectIdFilter(
    value: string | undefined
  ): string | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(trimmed) ? trimmed : undefined;
  }

  static parseRangeFilter(
    min: string | undefined,
    max: string | undefined
  ): { min?: number; max?: number } | undefined {
    const parsedMin = min ? this.parseNumericFilter(min) : undefined;
    const parsedMax = max ? this.parseNumericFilter(max) : undefined;
    
    if (parsedMin === undefined && parsedMax === undefined) {
      return undefined;
    }
    
    return { min: parsedMin, max: parsedMax };
  }
}
