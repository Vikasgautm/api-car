"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBodyTypeDto = void 0;
const validation_util_1 = require("../../../shared/utils/validation.util");
class UpdateBodyTypeDto {
    name;
    description;
    is_published;
    is_featured;
    logo_url;
    logo_title;
    static validate(dto) {
        const errors = [];
        if (dto.name !== undefined) {
            const nameLengthResult = validation_util_1.ValidationUtil.minLength(dto.name, 2, 'name');
            if (!nameLengthResult.valid)
                errors.push(...nameLengthResult.errors);
        }
        if (dto.description !== undefined) {
            const descResult = validation_util_1.ValidationUtil.maxLength(dto.description, 500, 'description');
            if (!descResult.valid)
                errors.push(...descResult.errors);
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.UpdateBodyTypeDto = UpdateBodyTypeDto;
//# sourceMappingURL=update-body-type.dto.js.map