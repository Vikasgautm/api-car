import { ValidationUtil } from '../../../shared/utils/validation.util';

export class CreateBlogDto {
  title!: string;
  content!: string;
  excerpt?: string;
  author_name?: string;
  author_id?: string;
  category!: string;
  tags?: string[];
  thumbnail_url?: string;
  thumbnail_alt?: string;
  images?: Array<{ url: string; alt?: string }>;
  link?: string;
  is_published?: boolean;
  is_featured?: boolean;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: string;
  canonical_url?: string;
  noindex?: boolean;

  static validate(dto: CreateBlogDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const titleResult = ValidationUtil.required(dto.title, 'title');
    if (!titleResult.valid) errors.push(...titleResult.errors);

    const titleLengthResult = ValidationUtil.minLength(dto.title, 3, 'title');
    if (!titleLengthResult.valid) errors.push(...titleLengthResult.errors);

    const contentResult = ValidationUtil.required(dto.content, 'content');
    if (!contentResult.valid) errors.push(...contentResult.errors);

    const categoryResult = ValidationUtil.required(dto.category, 'category');
    if (!categoryResult.valid) errors.push(...categoryResult.errors);

    if (dto.excerpt !== undefined) {
      const excerptResult = ValidationUtil.maxLength(dto.excerpt, 500, 'excerpt');
      if (!excerptResult.valid) errors.push(...excerptResult.errors);
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
