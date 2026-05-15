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

export class PaginationUtil {
  private static DEFAULT_LIMIT = 10;
  private static DEFAULT_MAX_LIMIT = 100;

  static getPaginationParams(
    page: number = 1,
    limit: number = PaginationUtil.DEFAULT_LIMIT,
    options: PaginationOptions = {}
  ): PaginationParams {
    const { maxLimit = PaginationUtil.DEFAULT_MAX_LIMIT } = options;
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(maxLimit, Math.max(1, limit));
    const skip = (validatedPage - 1) * validatedLimit;
    return { skip, limit: validatedLimit };
  }

  static createPaginationMeta(
    page: number,
    limit: number,
    total: number
  ): PaginationMeta {
    // page/limit can arrive as strings from req.query (validateQuery does not
    // assign coerced values back). Coerce here so consumers always receive
    // numbers in the response envelope.
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 1);
    const totalPages = Math.ceil(total / limitNum);
    return {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    };
  }

  static addSoftDeleteFilter<T extends Record<string, unknown>>(
    filter: T,
    field: string = 'is_deleted',
    includeDeleted: boolean = false
  ): T {
    if (includeDeleted) {
      return filter;
    }
    return { ...filter, [field]: false } as T;
  }

  static addPublishedFilter<T extends Record<string, unknown>>(
    filter: T,
    field: string = 'is_published',
    published: boolean = true
  ): T {
    return { ...filter, [field]: published } as T;
  }

  static addFieldFilter<T extends Record<string, unknown>>(
    filter: T,
    field: string,
    value: unknown
  ): T {
    return { ...filter, [field]: value } as T;
  }

  static removeFieldFilter<T extends Record<string, unknown>>(
    filter: T,
    field: string
  ): T {
    const { [field]: removed, ...rest } = filter as any;
    return rest as T;
  }

  static addOnlyDeletedFilter<T extends Record<string, unknown>>(
    filter: T,
    field: string = 'is_deleted'
  ): T {
    return { ...filter, [field]: true } as T;
  }
}
