import { ValidationUtil } from '../../../shared/utils/validation.util';

export class CreateBrandDto {
  name!: string;
  slug?: string;
  description?: string;
  logo_url?: string;
  logo_title?: string;
  is_published?: boolean;
  is_featured?: boolean;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: string;
  canonical_url?: string;
  noindex?: boolean;

  static validate(dto: CreateBrandDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const nameResult = ValidationUtil.required(dto.name, 'name');
    if (!nameResult.valid) errors.push(...nameResult.errors);

    const nameLengthResult = ValidationUtil.minLength(dto.name, 2, 'name');
    if (!nameLengthResult.valid) errors.push(...nameLengthResult.errors);

    if (dto.description !== undefined) {
      const descResult = ValidationUtil.maxLength(dto.description, 8000, 'description');
      if (!descResult.valid) errors.push(...descResult.errors);
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
