"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTagDto = void 0;
const validation_util_1 = require("../../../shared/utils/validation.util");
class CreateTagDto {
    tag_category_id;
    name;
    description;
    seo_meta;
    is_published;
    sort_order;
    static validate(dto) {
        const errors = [];
        const categoryRequired = validation_util_1.ValidationUtil.required(dto.tag_category_id, 'tag_category_id');
        if (!categoryRequired.valid)
            errors.push(...categoryRequired.errors);
        const nameRequired = validation_util_1.ValidationUtil.required(dto.name, 'name');
        if (!nameRequired.valid)
            errors.push(...nameRequired.errors);
        else {
            const nameLen = validation_util_1.ValidationUtil.minLength(dto.name, 2, 'name');
            if (!nameLen.valid)
                errors.push(...nameLen.errors);
        }
        if (dto.description !== undefined) {
            const descLen = validation_util_1.ValidationUtil.maxLength(dto.description, 2000, 'description');
            if (!descLen.valid)
                errors.push(...descLen.errors);
        }
        if (dto.seo_meta?.description !== undefined) {
            const seoLen = validation_util_1.ValidationUtil.maxLength(dto.seo_meta.description, 160, 'seo_meta.description');
            if (!seoLen.valid)
                errors.push(...seoLen.errors);
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.CreateTagDto = CreateTagDto;
//# sourceMappingURL=create-tag.dto.js.map