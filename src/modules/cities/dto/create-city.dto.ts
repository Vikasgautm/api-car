import { ValidationUtil } from '../../../shared/utils/validation.util';

export class CreateCityDto {
  name!: string;
  slug?: string;
  state!: string;
  pincode?: number;
  longitude?: number;
  latitude?: number;

  static validate(dto: CreateCityDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const nameResult = ValidationUtil.required(dto.name, 'name');
    if (!nameResult.valid) errors.push(...nameResult.errors);

    const nameLengthResult = ValidationUtil.minLength(dto.name, 2, 'name');
    if (!nameLengthResult.valid) errors.push(...nameLengthResult.errors);

    const stateResult = ValidationUtil.required(dto.state, 'state');
    if (!stateResult.valid) errors.push(...stateResult.errors);

    const stateLengthResult = ValidationUtil.minLength(dto.state, 2, 'state');
    if (!stateLengthResult.valid) errors.push(...stateLengthResult.errors);

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
