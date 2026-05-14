import { ValidationUtil } from '../../../shared/utils/validation.util';

export class UpdateTagDto {
  tag_category_id?: string;
  name?: string;
  description?: string;
  seo_meta?: {
    title?: string;
    description?: string;
    h1?: string;
  };
  is_published?: boolean;
  sort_order?: number;

  static validate(dto: UpdateTagDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (dto.name !== undefined) {
      const nameLen = ValidationUtil.minLength(dto.name, 2, 'name');
      if (!nameLen.valid) errors.push(...nameLen.errors);
    }

    if (dto.description !== undefined) {
      const descLen = ValidationUtil.maxLength(dto.description, 2000, 'description');
      if (!descLen.valid) errors.push(...descLen.errors);
    }

    if (dto.seo_meta?.description !== undefined) {
      const seoLen = ValidationUtil.maxLength(dto.seo_meta.description, 160, 'seo_meta.description');
      if (!seoLen.valid) errors.push(...seoLen.errors);
    }

    return { valid: errors.length === 0, errors };
  }
}
