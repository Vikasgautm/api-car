"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBodyTypeDto = void 0;
const validation_util_1 = require("../../../shared/utils/validation.util");
class CreateBodyTypeDto {
    name;
    description;
    seo_title;
    meta_description;
    intro_content;
    short_description;
    is_published;
    is_featured;
    logo_url;
    logo_title;
    hero_image_url;
    hero_image_alt;
    sort_order;
    parent_id;
    related_body_types;
    created_by;
    static validate(dto) {
        const errors = [];
        const nameResult = validation_util_1.ValidationUtil.required(dto.name, 'name');
        if (!nameResult.valid)
            errors.push(...nameResult.errors);
        const nameLengthResult = validation_util_1.ValidationUtil.minLength(dto.name, 2, 'name');
        if (!nameLengthResult.valid)
            errors.push(...nameLengthResult.errors);
        if (dto.description !== undefined) {
            const descResult = validation_util_1.ValidationUtil.maxLength(dto.description, 8000, 'description');
            if (!descResult.valid)
                errors.push(...descResult.errors);
        }
        if (dto.seo_title !== undefined) {
            const result = validation_util_1.ValidationUtil.maxLength(dto.seo_title, 160, 'seo_title');
            if (!result.valid)
                errors.push(...result.errors);
        }
        if (dto.meta_description !== undefined) {
            const result = validation_util_1.ValidationUtil.maxLength(dto.meta_description, 320, 'meta_description');
            if (!result.valid)
                errors.push(...result.errors);
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.CreateBodyTypeDto = CreateBodyTypeDto;
//# sourceMappingURL=create-body-type.dto.js.map