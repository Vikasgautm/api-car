"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationDto = void 0;
class PaginationDto {
    page = 1;
    limit = 10;
    sortBy = 'createdAt';
    sortOrder = 'desc';
    search;
    static validate(dto) {
        const errors = [];
        if (dto.page !== undefined && (dto.page < 1 || !Number.isInteger(dto.page))) {
            errors.push('Page must be a positive integer');
        }
        if (dto.limit !== undefined) {
            if (!Number.isInteger(dto.limit) || dto.limit < 1) {
                errors.push('Limit must be a positive integer');
            }
            else if (dto.limit > 100) {
                errors.push('Limit cannot exceed 100');
            }
        }
        if (dto.sortOrder && !['asc', 'desc'].includes(dto.sortOrder)) {
            errors.push('Sort order must be either asc or desc');
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.PaginationDto = PaginationDto;
//# sourceMappingURL=pagination.dto.js.map