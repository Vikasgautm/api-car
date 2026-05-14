"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTagDto = void 0;
const validation_util_1 = require("../../../shared/utils/validation.util");
class UpdateTagDto {
    tag_category_id;
    name;
    description;
    seo_meta;
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
        if (dto.seo_meta?.description !== undefined) {
            const seoLen = validation_util_1.ValidationUtil.maxLength(dto.seo_meta.description, 160, 'seo_meta.description');
            if (!seoLen.valid)
                errors.push(...seoLen.errors);
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.UpdateTagDto = UpdateTagDto;
//# sourceMappingURL=update-tag.dto.js.map