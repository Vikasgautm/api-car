"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryParserUtil = void 0;
class QueryParserUtil {
    static parsePagination(query) {
        const page = Math.max(1, parseInt(query.page || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10)));
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder || 'desc';
        return { page, limit, sortBy, sortOrder };
    }
    static parseQuery(query) {
        const pagination = this.parsePagination(query);
        const search = query.search;
        const filters = {};
        const reservedKeys = ['page', 'limit', 'sortBy', 'sortOrder', 'search', 'q'];
        for (const [key, value] of Object.entries(query)) {
            if (!reservedKeys.includes(key) && value !== undefined && value !== null && value !== '') {
                filters[key] = value;
            }
        }
        // Also check for 'q' as search parameter
        const searchTerm = search || query.q;
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
    static parseNumericFilter(value) {
        if (!value)
            return undefined;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? undefined : parsed;
    }
    static parseBooleanFilter(value) {
        if (!value)
            return undefined;
        if (value === 'true' || value === '1')
            return true;
        if (value === 'false' || value === '0')
            return false;
        return undefined;
    }
    static parseArrayFilter(value) {
        if (!value)
            return undefined;
        return value.split(',').map((v) => v.trim()).filter((v) => v.length > 0);
    }
    static parseIdFilter(value) {
        if (!value)
            return undefined;
        return value.trim();
    }
    static parseDateFilter(value) {
        if (!value)
            return undefined;
        const date = new Date(value);
        return isNaN(date.getTime()) ? undefined : date;
    }
    static parseObjectIdFilter(value) {
        if (!value)
            return undefined;
        const trimmed = value.trim();
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        return objectIdRegex.test(trimmed) ? trimmed : undefined;
    }
    static parseRangeFilter(min, max) {
        const parsedMin = min ? this.parseNumericFilter(min) : undefined;
        const parsedMax = max ? this.parseNumericFilter(max) : undefined;
        if (parsedMin === undefined && parsedMax === undefined) {
            return undefined;
        }
        return { min: parsedMin, max: parsedMax };
    }
}
exports.QueryParserUtil = QueryParserUtil;
//# sourceMappingURL=query-parser.util.js.map