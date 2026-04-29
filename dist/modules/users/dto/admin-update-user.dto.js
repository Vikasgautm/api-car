"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUpdateUserDto = void 0;
const user_model_1 = require("../../../models/user.model");
const validation_util_1 = require("../../../shared/utils/validation.util");
class AdminUpdateUserDto {
    user_name;
    email;
    phone;
    profile_pic;
    role;
    is_email_verified;
    theme;
    is_active;
    static validate(dto) {
        const errors = [];
        if (dto.user_name !== undefined) {
            const nameResult = validation_util_1.ValidationUtil.minLength(dto.user_name, 2, 'user_name');
            if (!nameResult.valid)
                errors.push(...nameResult.errors);
        }
        if (dto.email !== undefined) {
            const emailResult = validation_util_1.ValidationUtil.email(dto.email);
            if (!emailResult.valid)
                errors.push(...emailResult.errors);
        }
        if (dto.phone !== undefined && dto.phone.length > 0) {
            if (dto.phone.length < 10) {
                errors.push('Phone number must be at least 10 characters');
            }
        }
        if (dto.role !== undefined) {
            const validRoles = Object.values(user_model_1.UserRole);
            if (!validRoles.includes(dto.role)) {
                errors.push(`Role must be one of: ${validRoles.join(', ')}`);
            }
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.AdminUpdateUserDto = AdminUpdateUserDto;
//# sourceMappingURL=admin-update-user.dto.js.map