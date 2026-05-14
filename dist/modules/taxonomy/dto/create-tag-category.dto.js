"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTagCategoryDto = void 0;
const validation_util_1 = require("../../../shared/utils/validation.util");
class CreateTagCategoryDto {
    name;
    type;
    description;
    is_published;
    sort_order;
    static validate(dto) {
        const errors = [];
        const nameRequired = validation_util_1.ValidationUtil.required(dto.name, 'name');
        if (!nameRequired.valid)
            errors.push(...nameRequired.errors);
        else {
            const nameLen = validation_util_1.ValidationUtil.minLength(dto.name, 2, 'name');
            if (!nameLen.valid)
                errors.push(...nameLen.errors);
        }
        const typeRequired = validation_util_1.ValidationUtil.required(dto.type, 'type');
        if (!typeRequired.valid)
            errors.push(...typeRequired.errors);
        if (dto.description !== undefined) {
            const descLen = validation_util_1.ValidationUtil.maxLength(dto.description, 2000, 'description');
            if (!descLen.valid)
                errors.push(...descLen.errors);
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.CreateTagCategoryDto = CreateTagCategoryDto;
//# sourceMappingURL=create-tag-category.dto.js.map