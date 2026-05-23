"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBlogDto = void 0;
const validation_util_1 = require("../../../shared/utils/validation.util");
class UpdateBlogDto {
    title;
    content;
    excerpt;
    author_name;
    author_id;
    category;
    tags;
    thumbnail_url;
    thumbnail_alt;
    images;
    link;
    is_published;
    is_featured;
    meta_title;
    meta_description;
    meta_keywords;
    og_image;
    canonical_url;
    noindex;
    // Automotive intelligence fields
    article_type;
    article_status;
    article_intent;
    target_keyword;
    // Ecosystem relationships
    connected_cars;
    connected_variants;
    connected_brands;
    connected_body_types;
    connected_fuel_types;
    connected_comparisons;
    connected_collections;
    static validate(dto) {
        const errors = [];
        if (dto.title !== undefined) {
            const titleLengthResult = validation_util_1.ValidationUtil.minLength(dto.title, 3, 'title');
            if (!titleLengthResult.valid)
                errors.push(...titleLengthResult.errors);
        }
        if (dto.excerpt !== undefined) {
            const excerptResult = validation_util_1.ValidationUtil.maxLength(dto.excerpt, 8000, 'excerpt');
            if (!excerptResult.valid)
                errors.push(...excerptResult.errors);
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
exports.UpdateBlogDto = UpdateBlogDto;
//# sourceMappingURL=update-blog.dto.js.map