"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterUtil = void 0;
class FilterUtil {
    static escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    static buildSearchFilter(fields, searchTerm) {
        if (!searchTerm || !fields.length)
            return {};
        const trimmed = searchTerm.trim();
        const escaped = this.escapeRegExp(trimmed);
        const flexiblePattern = escaped.replace(/\s+/g, '[\\s-_]+');
        const pattern = /^[a-zA-Z0-9\s-_]+$/.test(trimmed)
            ? `\\b${flexiblePattern}\\b`
            : flexiblePattern;
        const regex = new RegExp(pattern, 'i');
        const searchConditions = fields.map((field) => ({
            [field]: regex,
        }));
        return { $or: searchConditions };
    }
    static mergeFilterWithOr(filter, searchFilter) {
        if (!searchFilter || Object.keys(searchFilter).length === 0)
            return filter;
        if (!filter || Object.keys(filter).length === 0) {
            Object.assign(filter, searchFilter);
            return filter;
        }
        if (filter.$or) {
            const existingOr = filter.$or;
            delete filter.$or;
            filter.$and = filter.$and || [];
            filter.$and.push({ $or: existingOr }, searchFilter);
            return filter;
        }
        else {
            Object.assign(filter, searchFilter);
            return filter;
        }
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
