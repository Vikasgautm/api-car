"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationUtil = void 0;
class PaginationUtil {
    static DEFAULT_LIMIT = 10;
    static DEFAULT_MAX_LIMIT = 100;
    static getPaginationParams(page = 1, limit = PaginationUtil.DEFAULT_LIMIT, options = {}) {
        const { maxLimit = PaginationUtil.DEFAULT_MAX_LIMIT } = options;
        const validatedPage = Math.max(1, page);
        const validatedLimit = Math.min(maxLimit, Math.max(1, limit));
        const skip = (validatedPage - 1) * validatedLimit;
        return { skip, limit: validatedLimit };
    }
    static createPaginationMeta(page, limit, total) {
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
    static addSoftDeleteFilter(filter, field = 'is_deleted', includeDeleted = false) {
        if (includeDeleted) {
            return filter;
        }
        return { ...filter, [field]: false };
    }
    static addPublishedFilter(filter, field = 'is_published', published = true) {
        return { ...filter, [field]: published };
    }
    static addFieldFilter(filter, field, value) {
        return { ...filter, [field]: value };
    }
    static removeFieldFilter(filter, field) {
        const { [field]: removed, ...rest } = filter;
        return rest;
    }
    static addOnlyDeletedFilter(filter, field = 'is_deleted') {
        return { ...filter, [field]: true };
    }
}
exports.PaginationUtil = PaginationUtil;
//# sourceMappingURL=pagination.util.js.map