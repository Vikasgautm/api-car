"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCarDto = void 0;
const validation_util_1 = require("../../../shared/utils/validation.util");
class UpdateCarDto {
    name;
    slug;
    brand_id;
    body_type_id;
    fuel_type_id;
    short_description;
    description;
    thumbnail_url;
    thumbnail_alt;
    gallery;
    gallery_summary;
    status;
    is_upcoming;
    is_launched;
    expected_exshowroom_price;
    expected_launch_date;
    exshowroom_price;
    launch_date;
    is_electric;
    is_published;
    is_featured;
    is_popular;
    is_recommended;
    is_latest;
    top_selling;
    tag_ids;
    model_family;
    generation_start_year;
    generation_end_year;
    generation_label;
    is_current;
    is_facelift;
    predecessor_car_id;
    successor_car_id;
    editor_user_id;
    seo_owner_user_id;
    reviewer_user_id;
    meta_title;
    meta_description;
    meta_keywords;
    og_image;
    canonical_url;
    noindex;
    static validate(dto) {
        const errors = [];
        if (dto.name !== undefined) {
            const nameLengthResult = validation_util_1.ValidationUtil.minLength(dto.name, 2, 'name');
            if (!nameLengthResult.valid)
                errors.push(...nameLengthResult.errors);
        }
        if (dto.short_description !== undefined) {
            const shortDescResult = validation_util_1.ValidationUtil.maxLength(dto.short_description, 8000, 'short_description');
            if (!shortDescResult.valid)
                errors.push(...shortDescResult.errors);
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
        // Conditional validation for upcoming cars
        const isUpcoming = dto.is_upcoming === true || dto.status === 'upcoming';
        if (isUpcoming) {
            if (dto.expected_exshowroom_price !== undefined && dto.expected_exshowroom_price === null) {
                errors.push('expected_exshowroom_price cannot be null for upcoming cars');
            }
            if (dto.expected_launch_date !== undefined && (dto.expected_launch_date === null || dto.expected_launch_date === '')) {
                errors.push('expected_launch_date cannot be null for upcoming cars');
            }
        }
        // Validate status consistency
        if (dto.status === 'upcoming' && dto.is_upcoming === false) {
            errors.push('status cannot be upcoming when is_upcoming is false');
        }
        if (dto.status === 'launched' && dto.is_upcoming === true) {
            errors.push('status cannot be launched when is_upcoming is true');
        }
        // Generation metadata sanity
        if (dto.model_family !== undefined && dto.model_family !== null && !/^[a-z0-9][a-z0-9-]*$/.test(String(dto.model_family).trim().toLowerCase())) {
            errors.push('model_family must be a slug-style token (lowercase letters, digits, hyphens)');
        }
        if (dto.generation_start_year !== undefined && dto.generation_start_year !== null && (dto.generation_start_year < 1900 || dto.generation_start_year > 2200)) {
            errors.push('generation_start_year must be between 1900 and 2200');
        }
        if (dto.generation_end_year !== undefined && dto.generation_end_year !== null && (dto.generation_end_year < 1900 || dto.generation_end_year > 2200)) {
            errors.push('generation_end_year must be between 1900 and 2200');
        }
        if (dto.generation_start_year !== undefined && dto.generation_start_year !== null &&
            dto.generation_end_year !== undefined && dto.generation_end_year !== null &&
            dto.generation_end_year < dto.generation_start_year) {
            errors.push('generation_end_year cannot be earlier than generation_start_year');
        }
        if (dto.is_current === true && dto.model_family !== undefined && (dto.model_family === null || String(dto.model_family).trim() === '')) {
            errors.push('is_current can only be true when model_family is set');
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.UpdateCarDto = UpdateCarDto;
//# sourceMappingURL=update-car.dto.js.map