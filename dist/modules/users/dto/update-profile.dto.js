"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProfileDto = void 0;
const validation_util_1 = require("../../../shared/utils/validation.util");
class UpdateProfileDto {
    user_name;
    phone;
    profile_pic;
    static validate(dto) {
        const errors = [];
        if (dto.user_name !== undefined) {
            const nameResult = validation_util_1.ValidationUtil.minLength(dto.user_name, 2, 'user_name');
            if (!nameResult.valid)
                errors.push(...nameResult.errors);
        }
        if (dto.phone !== undefined) {
            if (dto.phone.length > 0 && dto.phone.length < 10) {
                errors.push('Phone number must be at least 10 characters');
            }
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.UpdateProfileDto = UpdateProfileDto;
//# sourceMappingURL=update-profile.dto.js.map