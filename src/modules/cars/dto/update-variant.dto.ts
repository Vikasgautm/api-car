import {
  SpecsNormalized,
  TransmissionType,
  VariantMarketStatus,
  PublishStatus,
  VariantLifecycleStatus,
} from '../../../models/car-variant.model';

export class UpdateVariantDto {
  car_id?: string;
  variant_name?: string;
  slug?: string;
  model_year?: number;
  fuel_type_id?: string;
  transmission_type?: TransmissionType;
  drivetrain?: string;
  seating_capacity?: number;
  body_type?: string;
  ex_showroom_price?: number;
  expected_price?: number;
  expected_launch_date?: Date;
  is_upcoming?: boolean;
  specs_normalized?: SpecsNormalized;
  hidden_spec_keys?: string[];
  hidden_sections?: string[];
  visibility_overrides?: Record<string, 'auto' | 'manual-show' | 'manual-hide'>;
  is_published?: boolean;
  is_archived?: boolean;
  archived_at?: Date;
  archived_by?: string;
  editor_user_id?: string | null;
  seo_owner_user_id?: string | null;
  reviewer_user_id?: string | null;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: string;
  canonical_url?: string;
  noindex?: boolean;
  variant_rank?: number;
  trim_name?: string;
  edition_name?: string;
  value_for_money_tag?: boolean;
  best_for_tags?: string[];
  variant_highlights?: string[];
  market_status?: VariantMarketStatus;
  publish_status?: PublishStatus;
  variant_status?: VariantLifecycleStatus;

  static validate(dto: UpdateVariantDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (dto.model_year !== undefined && (dto.model_year < 1900 || dto.model_year > 2100)) {
      errors.push('model_year must be between 1900 and 2100');
    }

    if (dto.seating_capacity !== undefined && (dto.seating_capacity < 2 || dto.seating_capacity > 10)) {
      errors.push('seating_capacity must be between 2 and 10');
    }

    if (dto.ex_showroom_price !== undefined && dto.ex_showroom_price < 0) {
      errors.push('ex_showroom_price must be greater than or equal to 0');
    }

    if (dto.expected_price !== undefined && dto.expected_price < 0) {
      errors.push('expected_price must be greater than or equal to 0');
    }

    return { valid: errors.length === 0, errors };
  }
}
