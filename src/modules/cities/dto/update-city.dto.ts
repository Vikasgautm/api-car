import { ValidationUtil } from '../../../shared/utils/validation.util';

export class UpdateCityDto {
  name?: string;
  slug?: string;
  state?: string;
  pincode?: string;
  longitude?: number;
  latitude?: number;
  city_logo?: string;
  is_published?: boolean;
  is_featured?: boolean;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: string;
  canonical_url?: string;
  noindex?: boolean;

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
      const pincodeResult = ValidationUtil.pincode(dto.pincode);
      if (!pincodeResult.valid) errors.push(...pincodeResult.errors);
    }

    if (dto.latitude !== undefined) {
      const latResult = ValidationUtil.latitude(dto.latitude);
      if (!latResult.valid) errors.push(...latResult.errors);
    }

    if (dto.longitude !== undefined) {
      const lngResult = ValidationUtil.longitude(dto.longitude);
      if (!lngResult.valid) errors.push(...lngResult.errors);
    }

    if (dto.meta_description !== undefined) {
      const metaDescResult = ValidationUtil.maxLength(dto.meta_description, 160, 'meta_description');
      if (!metaDescResult.valid) errors.push(...metaDescResult.errors);
    }

    if (dto.canonical_url !== undefined && dto.canonical_url) {
      const urlResult = ValidationUtil.url(dto.canonical_url);
      if (!urlResult.valid) errors.push(...urlResult.errors);
    }

    return { valid: errors.length === 0, errors };
  }
}
