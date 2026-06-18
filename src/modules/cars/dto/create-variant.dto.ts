import {
  SpecsNormalized,
  TransmissionType,
  VariantMarketStatus,
  PublishStatus,
  VariantLifecycleStatus,
} from '../../../models/car-variant.model';
import { ValidationUtil } from '../../../shared/utils/validation.util';

export class CreateVariantDto {
  car_id!: string;
  variant_name!: string;
  slug?: string;
  model_year!: number;
  fuel_type_id?: string;
  transmission_type!: TransmissionType;
  drivetrain?: string;
  seating_capacity?: number;
  body_type?: string;
  ex_showroom_price?: number;
  expected_price?: number;
  expected_launch_date?: Date;
  specs_normalized?: SpecsNormalized;
  hidden_spec_keys?: string[];
  hidden_sections?: string[];
  visibility_overrides?: Record<string, 'auto' | 'manual-show' | 'manual-hide'>;
  is_published?: boolean;
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

  static validate(dto: CreateVariantDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const carIdResult = ValidationUtil.required(dto.car_id, 'car_id');
    if (!carIdResult.valid) errors.push(...carIdResult.errors);

    const variantNameResult = ValidationUtil.required(dto.variant_name, 'variant_name');
    if (!variantNameResult.valid) errors.push(...variantNameResult.errors);

    const modelYearResult = ValidationUtil.required(dto.model_year, 'model_year');
    if (!modelYearResult.valid) errors.push(...modelYearResult.errors);

    // fuel_type_id is now optional - allow creation without fuel type if none exist
    // const fuelTypeIdResult = ValidationUtil.required(dto.fuel_type_id, 'fuel_type_id');
    // if (!fuelTypeIdResult.valid) errors.push(...fuelTypeIdResult.errors);

    const transmissionResult = ValidationUtil.required(dto.transmission_type, 'transmission_type');
    if (!transmissionResult.valid) errors.push(...transmissionResult.errors);

    if (dto.model_year && (dto.model_year < 1900 || dto.model_year > 2100)) {
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
