"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCityDto = void 0;
const validation_util_1 = require("../../../shared/utils/validation.util");
class UpdateCityDto {
    name;
    slug;
    state;
    pincode;
    longitude;
    latitude;
    static validate(dto) {
        const errors = [];
        if (dto.name !== undefined) {
            const nameLengthResult = validation_util_1.ValidationUtil.minLength(dto.name, 2, 'name');
            if (!nameLengthResult.valid)
                errors.push(...nameLengthResult.errors);
        }
        if (dto.state !== undefined) {
            const stateLengthResult = validation_util_1.ValidationUtil.minLength(dto.state, 2, 'state');
            if (!stateLengthResult.valid)
                errors.push(...stateLengthResult.errors);
        }
        if (dto.slug !== undefined) {
            const slugResult = validation_util_1.ValidationUtil.slug(dto.slug);
            if (!slugResult.valid)
                errors.push(...slugResult.errors);
        }
        if (dto.pincode !== undefined) {
            if (typeof dto.pincode !== 'number' || !Number.isInteger(dto.pincode) || dto.pincode < 100000 || dto.pincode > 999999) {
                errors.push('Pincode must be a valid 6-digit number');
            }
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
        return { valid: errors.length === 0, errors };
    }
}
exports.UpdateCityDto = UpdateCityDto;
//# sourceMappingURL=update-city.dto.js.map