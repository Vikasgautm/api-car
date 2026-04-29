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
        if (dto.page !== undefined && (dto.page < 1 || !Number.isInteger(dto.page))) {
            errors.push('Page must be a positive integer');
        }
        if (dto.limit !== undefined && (dto.limit < 1 || dto.limit > 100)) {
            errors.push('Limit must be between 1 and 100');
        }
        if (dto.sortOrder !== undefined && !['asc', 'desc'].includes(dto.sortOrder)) {
            errors.push('Sort order must be either "asc" or "desc"');
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.UserFilterDto = UserFilterDto;
//# sourceMappingURL=user-filter.dto.js.map