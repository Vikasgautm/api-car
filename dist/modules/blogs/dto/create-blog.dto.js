"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBlogDto = void 0;
const validation_util_1 = require("../../../shared/utils/validation.util");
class CreateBlogDto {
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
        const titleResult = validation_util_1.ValidationUtil.required(dto.title, 'title');
        if (!titleResult.valid)
            errors.push(...titleResult.errors);
        const titleLengthResult = validation_util_1.ValidationUtil.minLength(dto.title, 3, 'title');
        if (!titleLengthResult.valid)
            errors.push(...titleLengthResult.errors);
        const contentResult = validation_util_1.ValidationUtil.required(dto.content, 'content');
        if (!contentResult.valid)
            errors.push(...contentResult.errors);
        const categoryResult = validation_util_1.ValidationUtil.required(dto.category, 'category');
        if (!categoryResult.valid)
            errors.push(...categoryResult.errors);
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
exports.CreateBlogDto = CreateBlogDto;
//# sourceMappingURL=create-blog.dto.js.map