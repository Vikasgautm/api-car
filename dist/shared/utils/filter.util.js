"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterUtil = void 0;
class FilterUtil {
    static buildSearchFilter(fields, searchTerm) {
        if (!searchTerm || !fields.length)
            return {};
        const regex = new RegExp(searchTerm, 'i');
        const searchConditions = fields.map((field) => ({
            [field]: regex,
        }));
        return { $or: searchConditions };
    }
    static buildSortFilter(sortBy, sortOrder = 'asc') {
        return { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    }
    static buildDateRangeFilter(field, startDate, endDate) {
        const filter = {};
        if (startDate || endDate) {
            filter[field] = {};
            if (startDate)
                filter[field].$gte = startDate;
            if (endDate)
                filter[field].$lte = endDate;
        }
        return filter;
    }
    static buildArrayFilter(field, values) {
        if (!values || values.length === 0)
            return {};
        return { [field]: { $in: values } };
    }
    static buildObjectIdFilter(field, value) {
        if (!value)
            return {};
        return { [field]: value };
    }
    static buildNumericRangeFilter(field, min, max) {
        const filter = {};
        if (min !== undefined || max !== undefined) {
            filter[field] = {};
            if (min !== undefined)
                filter[field].$gte = min;
            if (max !== undefined)
                filter[field].$lte = max;
        }
        return filter;
    }
    static buildBooleanFilter(field, value) {
        if (value === undefined)
            return {};
        return { [field]: value };
    }
    static buildEnumFilter(field, value) {
        if (!value)
            return {};
        return { [field]: value };
    }
}
exports.FilterUtil = FilterUtil;
//# sourceMappingURL=filter.util.js.map