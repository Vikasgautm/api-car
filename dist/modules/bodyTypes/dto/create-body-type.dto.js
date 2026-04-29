"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBodyTypeDto = void 0;
const validation_util_1 = require("../../../shared/utils/validation.util");
class CreateBodyTypeDto {
    name;
    description;
    is_published;
    is_featured;
    logo_url;
    logo_title;
    static validate(dto) {
        const errors = [];
        const nameResult = validation_util_1.ValidationUtil.required(dto.name, 'name');
        if (!nameResult.valid)
            errors.push(...nameResult.errors);
        const nameLengthResult = validation_util_1.ValidationUtil.minLength(dto.name, 2, 'name');
        if (!nameLengthResult.valid)
            errors.push(...nameLengthResult.errors);
        if (dto.description !== undefined) {
            const descResult = validation_util_1.ValidationUtil.maxLength(dto.description, 500, 'description');
            if (!descResult.valid)
                errors.push(...descResult.errors);
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.CreateBodyTypeDto = CreateBodyTypeDto;
//# sourceMappingURL=create-body-type.dto.js.map