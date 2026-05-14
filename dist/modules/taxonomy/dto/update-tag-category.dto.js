"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTagCategoryDto = void 0;
const validation_util_1 = require("../../../shared/utils/validation.util");
class UpdateTagCategoryDto {
    name;
    type;
    description;
    is_published;
    sort_order;
    static validate(dto) {
        const errors = [];
        if (dto.name !== undefined) {
            const nameLen = validation_util_1.ValidationUtil.minLength(dto.name, 2, 'name');
            if (!nameLen.valid)
                errors.push(...nameLen.errors);
        }
        if (dto.description !== undefined) {
            const descLen = validation_util_1.ValidationUtil.maxLength(dto.description, 2000, 'description');
            if (!descLen.valid)
                errors.push(...descLen.errors);
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.UpdateTagCategoryDto = UpdateTagCategoryDto;
//# sourceMappingURL=update-tag-category.dto.js.map