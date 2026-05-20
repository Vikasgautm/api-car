"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateVariantDto = void 0;
const validation_util_1 = require("../../../shared/utils/validation.util");
class CreateVariantDto {
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
    specs_normalized;
    hidden_spec_keys;
    hidden_sections;
    visibility_overrides;
    is_published;
    meta_title;
    meta_description;
    meta_keywords;
    og_image;
    canonical_url;
    noindex;
    static validate(dto) {
        const errors = [];
        const carIdResult = validation_util_1.ValidationUtil.required(dto.car_id, 'car_id');
        if (!carIdResult.valid)
            errors.push(...carIdResult.errors);
        const variantNameResult = validation_util_1.ValidationUtil.required(dto.variant_name, 'variant_name');
        if (!variantNameResult.valid)
            errors.push(...variantNameResult.errors);
        const modelYearResult = validation_util_1.ValidationUtil.required(dto.model_year, 'model_year');
        if (!modelYearResult.valid)
            errors.push(...modelYearResult.errors);
        // fuel_type_id is now optional - allow creation without fuel type if none exist
        // const fuelTypeIdResult = ValidationUtil.required(dto.fuel_type_id, 'fuel_type_id');
        // if (!fuelTypeIdResult.valid) errors.push(...fuelTypeIdResult.errors);
        const transmissionResult = validation_util_1.ValidationUtil.required(dto.transmission_type, 'transmission_type');
        if (!transmissionResult.valid)
            errors.push(...transmissionResult.errors);
        if (dto.model_year && (dto.model_year < 1900 || dto.model_year > 2100)) {
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
exports.CreateVariantDto = CreateVariantDto;
//# sourceMappingURL=create-variant.dto.js.map