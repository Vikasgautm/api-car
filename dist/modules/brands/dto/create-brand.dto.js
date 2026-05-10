"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBrandDto = void 0;
const validation_util_1 = require("../../../shared/utils/validation.util");
class CreateBrandDto {
    name;
    slug;
    description;
    logo_url;
    logo_title;
    is_published;
    is_featured;
    meta_title;
    meta_description;
    meta_keywords;
    og_image;
    canonical_url;
    noindex;
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
        if (dto.meta_description !== undefined) {
            const metaDescResult = validation_util_1.ValidationUtil.maxLength(dto.meta_description, 160, 'meta_description');
            if (!metaDescResult.valid)
                errors.push(...metaDescResult.errors);
        }
        if (dto.canonical_url !== undefined && dto.canonical_url) {
            const urlResult = validation_util_1.ValidationUtil.url(dto.canonical_url);
            if (!urlResult.valid)
                errors.push(...urlResult.errors);
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.CreateBrandDto = CreateBrandDto;
//# sourceMappingURL=create-brand.dto.js.map