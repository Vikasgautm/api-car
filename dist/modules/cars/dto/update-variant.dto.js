"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateVariantDto = void 0;
class UpdateVariantDto {
    car_id;
    variant_name;
    slug;
    model_year;
    fuel_type_id;
    transmission_type;
    drivetrain;
    seating_capacity;
    body_type;
    ex_showroom_price;
    expected_price;
    expected_launch_date;
    is_upcoming;
    specs_normalized;
    hidden_spec_keys;
    hidden_sections;
    visibility_overrides;
    is_published;
    is_archived;
    archived_at;
    archived_by;
    editor_user_id;
    seo_owner_user_id;
    reviewer_user_id;
    meta_title;
    meta_description;
    meta_keywords;
    og_image;
    canonical_url;
    noindex;
    variant_rank;
    trim_name;
    edition_name;
    value_for_money_tag;
    best_for_tags;
    variant_highlights;
    market_status;
    publish_status;
    variant_status;
    static validate(dto) {
        const errors = [];
        if (dto.model_year !== undefined && (dto.model_year < 1900 || dto.model_year > 2100)) {
            errors.push('model_year must be between 1900 and 2100');
        }
        if (dto.seating_capacity !== undefined && (dto.seating_capacity < 2 || dto.seating_capacity > 10)) {
            errors.push('seating_capacity must be between 2 and 10');
        }
        if (dto.ex_showroom_price !== undefined && dto.ex_showroom_price < 0) {
            errors.push('ex_showroom_price must be greater than or equal to 0');
        }
        if (dto.expected_price !== undefined && dto.expected_price < 0) {
            errors.push('expected_price must be greater than or equal to 0');
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.UpdateVariantDto = UpdateVariantDto;
//# sourceMappingURL=update-variant.dto.js.map