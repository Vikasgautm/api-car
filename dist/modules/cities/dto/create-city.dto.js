"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCityDto = void 0;
const validation_util_1 = require("../../../shared/utils/validation.util");
class CreateCityDto {
    name;
    slug;
    state;
    pincode;
    longitude;
    latitude;
    city_logo;
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
        const stateResult = validation_util_1.ValidationUtil.required(dto.state, 'state');
        if (!stateResult.valid)
            errors.push(...stateResult.errors);
        const stateLengthResult = validation_util_1.ValidationUtil.minLength(dto.state, 2, 'state');
        if (!stateLengthResult.valid)
            errors.push(...stateLengthResult.errors);
        if (dto.slug !== undefined) {
            const slugResult = validation_util_1.ValidationUtil.slug(dto.slug);
            if (!slugResult.valid)
                errors.push(...slugResult.errors);
        }
        if (dto.pincode !== undefined) {
            const pincodeResult = validation_util_1.ValidationUtil.pincode(dto.pincode);
            if (!pincodeResult.valid)
                errors.push(...pincodeResult.errors);
        }
        if (dto.latitude !== undefined) {
            const latResult = validation_util_1.ValidationUtil.latitude(dto.latitude);
            if (!latResult.valid)
                errors.push(...latResult.errors);
        }
        if (dto.longitude !== undefined) {
            const lngResult = validation_util_1.ValidationUtil.longitude(dto.longitude);
            if (!lngResult.valid)
                errors.push(...lngResult.errors);
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
exports.CreateCityDto = CreateCityDto;
//# sourceMappingURL=create-city.dto.js.map