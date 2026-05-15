"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRedirectDto = void 0;
const validation_util_1 = require("../../../shared/utils/validation.util");
class CreateRedirectDto {
    old_url;
    new_url;
    type;
    reason;
    static validate(dto) {
        const errors = [];
        const oldResult = validation_util_1.ValidationUtil.required(dto.old_url, 'old_url');
        if (!oldResult.valid)
            errors.push(...oldResult.errors);
        const newResult = validation_util_1.ValidationUtil.required(dto.new_url, 'new_url');
        if (!newResult.valid)
            errors.push(...newResult.errors);
        if (dto.old_url && !dto.old_url.startsWith('/')) {
            errors.push('old_url must start with "/" (path only, no origin)');
        }
        if (dto.new_url && !dto.new_url.startsWith('/')) {
            errors.push('new_url must start with "/" (path only, no origin)');
        }
        if (dto.old_url && dto.new_url && dto.old_url.trim() === dto.new_url.trim()) {
            errors.push('old_url and new_url must differ');
        }
        if (dto.type !== undefined && dto.type !== '301' && dto.type !== '302') {
            errors.push('type must be "301" or "302"');
        }
        if (dto.reason !== undefined && dto.reason.length > 500) {
            errors.push('reason must not exceed 500 characters');
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.CreateRedirectDto = CreateRedirectDto;
//# sourceMappingURL=create-redirect.dto.js.map