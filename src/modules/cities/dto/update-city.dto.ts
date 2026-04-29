import { ValidationUtil } from '../../../shared/utils/validation.util';

export class UpdateCityDto {
  name?: string;
  slug?: string;
  state?: string;
  pincode?: number;
  longitude?: number;
  latitude?: number;

  static validate(dto: UpdateCityDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (dto.name !== undefined) {
      const nameLengthResult = ValidationUtil.minLength(dto.name, 2, 'name');
      if (!nameLengthResult.valid) errors.push(...nameLengthResult.errors);
    }

    if (dto.state !== undefined) {
      const stateLengthResult = ValidationUtil.minLength(dto.state, 2, 'state');
      if (!stateLengthResult.valid) errors.push(...stateLengthResult.errors);
    }

    if (dto.slug !== undefined) {
      const slugResult = ValidationUtil.slug(dto.slug);
      if (!slugResult.valid) errors.push(...slugResult.errors);
    }

    if (dto.pincode !== undefined) {
      if (typeof dto.pincode !== 'number' || !Number.isInteger(dto.pincode) || dto.pincode < 100000 || dto.pincode > 999999) {
        errors.push('Pincode must be a valid 6-digit number');
      }
    }

    if (dto.latitude !== undefined) {
      const latResult = ValidationUtil.latitude(dto.latitude);
      if (!latResult.valid) errors.push(...latResult.errors);
    }

    if (dto.longitude !== undefined) {
      const lngResult = ValidationUtil.longitude(dto.longitude);
      if (!lngResult.valid) errors.push(...lngResult.errors);
    }

    return { valid: errors.length === 0, errors };
  }
}
