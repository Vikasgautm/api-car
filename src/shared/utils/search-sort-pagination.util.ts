import { QueryParserUtil, ParsedQuery } from './query-parser.util';
import { PaginationUtil, PaginationParams } from './pagination.util';
import { FilterUtil } from './filter.util';

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

export class SearchSortPaginationUtil {
  static parse(
    query: Record<string, unknown>,
    options: SearchSortPaginationOptions = {}
  ): SearchSortPaginationResult {
    const {
      searchableFields = [],
      sortableFields = [],
      defaultSortBy = 'createdAt',
      defaultSortOrder = 'desc',
      defaultLimit = 10,
      maxLimit = 100,
    } = options;

    // Parse query
    const parsedQuery = QueryParserUtil.parseQuery(query);

    // Build pagination
    const pagination = PaginationUtil.getPaginationParams(
      parsedQuery.page || defaultLimit,
      Math.min(parsedQuery.limit || defaultLimit, maxLimit)
    );

    // Build sort
    const sortBy = sortableFields.length > 0 && !sortableFields.includes(parsedQuery.sortBy || defaultSortBy)
      ? defaultSortBy
      : (parsedQuery.sortBy || defaultSortBy);

    const sortOrder = parsedQuery.sortOrder || defaultSortOrder;
    const sort = FilterUtil.buildSortFilter(sortBy, sortOrder);

    // Build filter
    let filter: Record<string, unknown> = { ...parsedQuery.filters };

    // Add search filter if search term and searchable fields provided
    if (parsedQuery.search && searchableFields.length > 0) {
      const searchFilter = FilterUtil.buildSearchFilter(searchableFields, parsedQuery.search);
      filter = { ...filter, ...searchFilter };
    }

    return {
      filter,
      sort,
      pagination,
      search: parsedQuery.search,
    };
  }

  static parseWithSoftDelete(
    query: Record<string, unknown>,
    options: SearchSortPaginationOptions = {},
    includeDeleted: boolean = false
  ): SearchSortPaginationResult {
    const result = this.parse(query, options);

    if (!includeDeleted) {
      result.filter = PaginationUtil.addSoftDeleteFilter(result.filter);
    }

    return result;
  }

  static parseWithPublished(
    query: Record<string, unknown>,
    options: SearchSortPaginationOptions = {},
    publishedField: string = 'is_published'
  ): SearchSortPaginationResult {
    const result = this.parse(query, options);
    result.filter = PaginationUtil.addPublishedFilter(result.filter, publishedField);

    return result;
  }

  static parseWithSoftDeleteAndPublished(
    query: Record<string, unknown>,
    options: SearchSortPaginationOptions = {},
    includeDeleted: boolean = false,
    publishedField: string = 'is_published'
  ): SearchSortPaginationResult {
    const result = this.parseWithSoftDelete(query, options, includeDeleted);
    result.filter = PaginationUtil.addPublishedFilter(result.filter, publishedField);

    return result;
  }

  static buildAggregatePipeline(
    query: Record<string, unknown>,
    options: SearchSortPaginationOptions = {}
  ): any[] {
    const result = this.parse(query, options);

    const pipeline: any[] = [];

    // Add match stage for filters
    if (Object.keys(result.filter).length > 0) {
      pipeline.push({ $match: result.filter });
    }

    // Add sort stage
    pipeline.push({ $sort: result.sort });

    // Add skip and limit for pagination
    pipeline.push({ $skip: result.pagination.skip });
    pipeline.push({ $limit: result.pagination.limit });

    return pipeline;
  }

  static buildAggregatePipelineWithCount(
    query: Record<string, unknown>,
    options: SearchSortPaginationOptions = {}
  ): any[] {
    const result = this.parse(query, options);

    const pipeline: any[] = [];

    // Add match stage for filters
    if (Object.keys(result.filter).length > 0) {
      pipeline.push({ $match: result.filter });
    }

    // Add facet to get both data and count
    pipeline.push({
      $facet: {
        data: [
          { $sort: result.sort },
          { $skip: result.pagination.skip },
          { $limit: result.pagination.limit },
        ],
        count: [{ $count: 'total' }],
      },
    });

    return pipeline;
  }
}
