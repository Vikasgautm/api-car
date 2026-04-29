"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchSortPaginationUtil = void 0;
const query_parser_util_1 = require("./query-parser.util");
const pagination_util_1 = require("./pagination.util");
const filter_util_1 = require("./filter.util");
class SearchSortPaginationUtil {
    static parse(query, options = {}) {
        const { searchableFields = [], sortableFields = [], defaultSortBy = 'createdAt', defaultSortOrder = 'desc', defaultLimit = 10, maxLimit = 100, } = options;
        // Parse query
        const parsedQuery = query_parser_util_1.QueryParserUtil.parseQuery(query);
        // Build pagination
        const pagination = pagination_util_1.PaginationUtil.getPaginationParams(parsedQuery.page || defaultLimit, Math.min(parsedQuery.limit || defaultLimit, maxLimit));
        // Build sort
        const sortBy = sortableFields.length > 0 && !sortableFields.includes(parsedQuery.sortBy || defaultSortBy)
            ? defaultSortBy
            : (parsedQuery.sortBy || defaultSortBy);
        const sortOrder = parsedQuery.sortOrder || defaultSortOrder;
        const sort = filter_util_1.FilterUtil.buildSortFilter(sortBy, sortOrder);
        // Build filter
        let filter = { ...parsedQuery.filters };
        // Add search filter if search term and searchable fields provided
        if (parsedQuery.search && searchableFields.length > 0) {
            const searchFilter = filter_util_1.FilterUtil.buildSearchFilter(searchableFields, parsedQuery.search);
            filter = { ...filter, ...searchFilter };
        }
        return {
            filter,
            sort,
            pagination,
            search: parsedQuery.search,
        };
    }
    static parseWithSoftDelete(query, options = {}, includeDeleted = false) {
        const result = this.parse(query, options);
        if (!includeDeleted) {
            result.filter = pagination_util_1.PaginationUtil.addSoftDeleteFilter(result.filter);
        }
        return result;
    }
    static parseWithPublished(query, options = {}, publishedField = 'is_published') {
        const result = this.parse(query, options);
        result.filter = pagination_util_1.PaginationUtil.addPublishedFilter(result.filter, publishedField);
        return result;
    }
    static parseWithSoftDeleteAndPublished(query, options = {}, includeDeleted = false, publishedField = 'is_published') {
        const result = this.parseWithSoftDelete(query, options, includeDeleted);
        result.filter = pagination_util_1.PaginationUtil.addPublishedFilter(result.filter, publishedField);
        return result;
    }
    static buildAggregatePipeline(query, options = {}) {
        const result = this.parse(query, options);
        const pipeline = [];
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
    static buildAggregatePipelineWithCount(query, options = {}) {
        const result = this.parse(query, options);
        const pipeline = [];
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
exports.SearchSortPaginationUtil = SearchSortPaginationUtil;
//# sourceMappingURL=search-sort-pagination.util.js.map