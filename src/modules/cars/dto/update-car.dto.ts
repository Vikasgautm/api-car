import { ValidationUtil } from '../../../shared/utils/validation.util';

export class UpdateCarDto {
  name?: string;
  slug?: string;
  brand_id?: string;
  body_type_id?: string;
  fuel_type_id?: string;
  short_description?: string;
  description?: string;
  thumbnail_url?: string;
  thumbnail_alt?: string;
  gallery?: Array<{ url: string; alt?: string }>;
  gallery_summary?: string;
  status?: 'upcoming' | 'launched' | 'discontinued' | 'archived' | 'disabled';
  is_upcoming?: boolean;
  is_launched?: boolean;
  expected_exshowroom_price?: number;
  expected_launch_date?: string;
  exshowroom_price?: number;
  launch_date?: string;
  is_electric?: boolean;
  is_published?: boolean;
  is_featured?: boolean;
  is_popular?: boolean;
  is_recommended?: boolean;
  is_latest?: boolean;
  top_selling?: boolean;
  tag_ids?: string[];
  editor_user_id?: string | null;
  seo_owner_user_id?: string | null;
  reviewer_user_id?: string | null;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: string;
  canonical_url?: string;
  noindex?: boolean;

  static validate(dto: UpdateCarDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (dto.name !== undefined) {
      const nameLengthResult = ValidationUtil.minLength(dto.name, 2, 'name');
      if (!nameLengthResult.valid) errors.push(...nameLengthResult.errors);
    }

    if (dto.short_description !== undefined) {
      const shortDescResult = ValidationUtil.maxLength(dto.short_description, 8000, 'short_description');
      if (!shortDescResult.valid) errors.push(...shortDescResult.errors);
    }

    if (dto.meta_description !== undefined) {
      const metaDescResult = ValidationUtil.maxLength(dto.meta_description, 160, 'meta_description');
      if (!metaDescResult.valid) errors.push(...metaDescResult.errors);
    }

    if (dto.canonical_url !== undefined && dto.canonical_url) {
      const urlResult = ValidationUtil.url(dto.canonical_url);
      if (!urlResult.valid) errors.push(...urlResult.errors);
    }

    // Conditional validation for upcoming cars
    const isUpcoming = dto.is_upcoming === true || dto.status === 'upcoming';
    
    if (isUpcoming) {
      if (dto.expected_exshowroom_price !== undefined && dto.expected_exshowroom_price === null) {
        errors.push('expected_exshowroom_price cannot be null for upcoming cars');
      }
      if (dto.expected_launch_date !== undefined && (dto.expected_launch_date === null || dto.expected_launch_date === '')) {
        errors.push('expected_launch_date cannot be null for upcoming cars');
      }
    }

    // Validate status consistency
    if (dto.status === 'upcoming' && dto.is_upcoming === false) {
      errors.push('status cannot be upcoming when is_upcoming is false');
    }
    if (dto.status === 'launched' && dto.is_upcoming === true) {
      errors.push('status cannot be launched when is_upcoming is true');
    }

    return { valid: errors.length === 0, errors };
  }
}
