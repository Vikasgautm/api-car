import { SpecsNormalized } from '../../../models/car-variant.model';

export type MatchType = 'exact' | 'alias' | 'normalized' | 'fuzzy' | 'unmatched';
export type ImportMode = 'create' | 'update' | 'merge';

export interface ExtractedCarData {
  name: string;
  brand: string;
  slug: string;
  description?: string;
  price_range_text?: string;
  min_price?: number;
  max_price?: number;
  fuel_type?: string;
  body_type?: string;
  range?: string;
  battery_capacity?: string;
  power?: string;
  boot_space?: string;
  safety_rating?: string;
  colors?: string[];
  variants?: string[];
  features?: string[];
  source_url: string;
}

export interface ExtractedVariantData {
  variant_name: string;
  full_name: string;
  price: number;
  price_text: string;
  fuel_type: string;
  transmission: string;
  specs: ExtractedSpec[];
  features?: string[];
  source_url: string;
}

export interface ExtractedSpec {
  section: string;
  label: string;
  value: string;
}

export interface MatchedField {
  field: string;
  value: any;
  matchType: MatchType;
  confidence: number;
  matched_key?: string;
  matched_key_id?: string;
}

export interface MatchedSpec {
  source_label: string;
  source_value: string;
  matched_key_id: string;
  matched_key_name: string;
  matched_key_slug: string;
  category: string;
  section: string;
  matchType: MatchType;
  confidence: number;
  suggested_path?: string;
}

export interface UnmatchedSpec {
  section: string;
  source_label: string;
  source_value: string;
  suggested_slug: string;
  suggested_category?: string;
}

export interface CarPreviewResponse {
  success: boolean;
  source: string;
  type: 'car';
  url: string;
  extracted: ExtractedCarData;
  matched: Record<string, MatchedField>;
  unmatched: string[];
  warnings: string[];
  existing_car?: {
    car_id: string;
    name: string;
    slug: string;
  };
}

export interface VariantPreviewResponse {
  success: boolean;
  source: string;
  type: 'variants';
  car_id: string;
  items: VariantPreviewItem[];
  warnings: string[];
}

export interface VariantPreviewItem {
  url: string;
  extracted: ExtractedVariantData;
  matched_specs: MatchedSpec[];
  unmatched_specs: UnmatchedSpec[];
  warnings: string[];
  matched_fuel_type?: MatchedField;
  normalized_transmission?: string | null;
  specs_normalized?: SpecsNormalized;
  existing_variant?: {
    variant_id: string;
    variant_name: string;
    slug: string;
  };
}

export interface SaveCarImportRequest {
  url: string;
  mode: ImportMode;
  car_id?: string;
  data: {
    name: string;
    brand_id: string;
    body_type_id: string;
    slug: string;
    description?: string;
    exshowroom_price?: number;
    expected_exshowroom_price?: number;
    is_electric: boolean;
    is_published: boolean;
  };
  unmatched_data: Record<string, any>;
}

export interface SaveVariantImportRequest {
  car_id: string;
  mode: ImportMode;
  items: SaveVariantItem[];
}

export interface SaveVariantItem {
  url: string;
  variant_id?: string;
  data: {
    name: string;
    slug: string;
    ex_showroom_price?: number;
    expected_price?: number;
    model_year: number;
    fuel_type_id: string;
    transmission_type: string;
    specs_normalized?: SpecsNormalized;
    is_published: boolean;
  };
  unmatched_specs: UnmatchedSpec[];
}

export interface ImportResult {
  success: boolean;
  car_id?: string;
  variant_ids?: string[];
  warnings: string[];
  errors: string[];
}
