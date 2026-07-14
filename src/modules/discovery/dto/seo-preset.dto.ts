import { ValidationUtil } from '../../../shared/utils/validation.util';

export class CreateSeoPresetDto {
  slug!: string;
  title!: string;
  h1?: string;
  meta_description?: string;
  meta_keywords?: string;
  hero_intro?: string;
  query_params?: Record<string, string>;
  is_published?: boolean;
  sort_order?: number;

  static validate(dto: CreateSeoPresetDto): { success: boolean; error: { errors: { message: string }[] } } {
    const errors: string[] = [];

    const slugRequired = ValidationUtil.required(dto.slug, 'slug');
    if (!slugRequired.valid) errors.push(...slugRequired.errors);
    else {
      const slugFormat = ValidationUtil.slug(dto.slug);
      if (!slugFormat.valid) errors.push(...slugFormat.errors);
    }

    const titleRequired = ValidationUtil.required(dto.title, 'title');
    if (!titleRequired.valid) errors.push(...titleRequired.errors);

    if (dto.meta_description !== undefined) {
      const r = ValidationUtil.maxLength(dto.meta_description, 160, 'meta_description');
      if (!r.valid) errors.push(...r.errors);
    }
    if (dto.hero_intro !== undefined) {
      const r = ValidationUtil.maxLength(dto.hero_intro, 2000, 'hero_intro');
      if (!r.valid) errors.push(...r.errors);
    }
    if (dto.query_params !== undefined && (typeof dto.query_params !== 'object' || Array.isArray(dto.query_params))) {
      errors.push('query_params must be an object of csv strings');
    }

    return {
      success: errors.length === 0,
      error: { errors: errors.map(e => ({ message: e })) }
    };
  }
}

export class UpdateSeoPresetDto {
  slug?: string;
  title?: string;
  h1?: string;
  meta_description?: string;
  meta_keywords?: string;
  hero_intro?: string;
  query_params?: Record<string, string>;
  is_published?: boolean;
  sort_order?: number;

  static validate(dto: UpdateSeoPresetDto): { success: boolean; error: { errors: { message: string }[] } } {
    const errors: string[] = [];
    if (dto.slug !== undefined) {
      const r = ValidationUtil.slug(dto.slug);
      if (!r.valid) errors.push(...r.errors);
    }
    if (dto.meta_description !== undefined) {
      const r = ValidationUtil.maxLength(dto.meta_description, 160, 'meta_description');
      if (!r.valid) errors.push(...r.errors);
    }
    if (dto.hero_intro !== undefined) {
      const r = ValidationUtil.maxLength(dto.hero_intro, 2000, 'hero_intro');
      if (!r.valid) errors.push(...r.errors);
    }
    if (dto.query_params !== undefined && (typeof dto.query_params !== 'object' || Array.isArray(dto.query_params))) {
      errors.push('query_params must be an object of csv strings');
    }
    return {
      success: errors.length === 0,
      error: { errors: errors.map(e => ({ message: e })) }
    };
  }
}
