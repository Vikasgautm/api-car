"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserFilterDto = void 0;
class UserFilterDto {
    page;
    limit;
    role;
    is_email_verified;
    is_active;
    q;
    sortBy;
    sortOrder;
    is_deleted;
    static validate(dto) {
        const errors = [];
        if (dto.page !== undefined) {
            const page = typeof dto.page === 'string' ? parseInt(dto.page, 10) : dto.page;
            if (isNaN(page) || page < 1 || !Number.isInteger(page)) {
                errors.push('Page must be a positive integer');
            }
        }
        if (dto.limit !== undefined) {
            const limit = typeof dto.limit === 'string' ? parseInt(dto.limit, 10) : dto.limit;
            if (isNaN(limit) || limit < 1 || limit > 1000) {
                errors.push('Limit must be between 1 and 1000');
            }
        }
        if (dto.sortOrder !== undefined && !['asc', 'desc'].includes(dto.sortOrder)) {
            errors.push('Sort order must be either "asc" or "desc"');
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.UserFilterDto = UserFilterDto;
//# sourceMappingURL=user-filter.dto.js.map