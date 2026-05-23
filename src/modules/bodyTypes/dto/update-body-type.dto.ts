import { ValidationUtil } from '../../../shared/utils/validation.util';

export class UpdateBodyTypeDto {
  name?: string;
  description?: string;
  seo_title?: string;
  meta_description?: string;
  intro_content?: string;
  short_description?: string;
  is_published?: boolean;
  is_featured?: boolean;
  logo_url?: string;
  logo_title?: string;
  hero_image_url?: string;
  hero_image_alt?: string;
  sort_order?: number;
  parent_id?: string;
  related_body_types?: string[];
  updated_by?: string;

  static validate(dto: UpdateBodyTypeDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (dto.name !== undefined) {
      const nameLengthResult = ValidationUtil.minLength(dto.name, 2, 'name');
      if (!nameLengthResult.valid) errors.push(...nameLengthResult.errors);
    }

    if (dto.description !== undefined) {
      const descResult = ValidationUtil.maxLength(dto.description, 8000, 'description');
      if (!descResult.valid) errors.push(...descResult.errors);
    }

    if (dto.seo_title !== undefined) {
      const result = ValidationUtil.maxLength(dto.seo_title, 160, 'seo_title');
      if (!result.valid) errors.push(...result.errors);
    }

    if (dto.meta_description !== undefined) {
      const result = ValidationUtil.maxLength(dto.meta_description, 320, 'meta_description');
      if (!result.valid) errors.push(...result.errors);
    }

    return { valid: errors.length === 0, errors };
  }
}
