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
            const shortDescResult = validation_util_1.ValidationUtil.maxLength(dto.short_description, 500, 'short_description');
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
        return { valid: errors.length === 0, errors };
    }
}
exports.UpdateCarDto = UpdateCarDto;
//# sourceMappingURL=update-car.dto.js.map