"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSeoPresetDto = exports.CreateSeoPresetDto = void 0;
const validation_util_1 = require("../../../shared/utils/validation.util");
class CreateSeoPresetDto {
    slug;
    title;
    h1;
    meta_description;
    meta_keywords;
    hero_intro;
    query_params;
    is_published;
    sort_order;
    static validate(dto) {
        const errors = [];
        const slugRequired = validation_util_1.ValidationUtil.required(dto.slug, 'slug');
        if (!slugRequired.valid)
            errors.push(...slugRequired.errors);
        else {
            const slugFormat = validation_util_1.ValidationUtil.slug(dto.slug);
            if (!slugFormat.valid)
                errors.push(...slugFormat.errors);
        }
        const titleRequired = validation_util_1.ValidationUtil.required(dto.title, 'title');
        if (!titleRequired.valid)
            errors.push(...titleRequired.errors);
        if (dto.meta_description !== undefined) {
            const r = validation_util_1.ValidationUtil.maxLength(dto.meta_description, 160, 'meta_description');
            if (!r.valid)
                errors.push(...r.errors);
        }
        if (dto.hero_intro !== undefined) {
            const r = validation_util_1.ValidationUtil.maxLength(dto.hero_intro, 2000, 'hero_intro');
            if (!r.valid)
                errors.push(...r.errors);
        }
        if (dto.query_params !== undefined && (typeof dto.query_params !== 'object' || Array.isArray(dto.query_params))) {
            errors.push('query_params must be an object of csv strings');
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.CreateSeoPresetDto = CreateSeoPresetDto;
class UpdateSeoPresetDto {
    slug;
    title;
    h1;
    meta_description;
    meta_keywords;
    hero_intro;
    query_params;
    is_published;
    sort_order;
    static validate(dto) {
        const errors = [];
        if (dto.slug !== undefined) {
            const r = validation_util_1.ValidationUtil.slug(dto.slug);
            if (!r.valid)
                errors.push(...r.errors);
        }
        if (dto.meta_description !== undefined) {
            const r = validation_util_1.ValidationUtil.maxLength(dto.meta_description, 160, 'meta_description');
            if (!r.valid)
                errors.push(...r.errors);
        }
        if (dto.hero_intro !== undefined) {
            const r = validation_util_1.ValidationUtil.maxLength(dto.hero_intro, 2000, 'hero_intro');
            if (!r.valid)
                errors.push(...r.errors);
        }
        if (dto.query_params !== undefined && (typeof dto.query_params !== 'object' || Array.isArray(dto.query_params))) {
            errors.push('query_params must be an object of csv strings');
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.UpdateSeoPresetDto = UpdateSeoPresetDto;
//# sourceMappingURL=seo-preset.dto.js.map