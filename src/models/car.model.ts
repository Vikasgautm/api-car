import { MileageClass } from "../constants/mileage-benchmarks";

export type CarStatus = 'upcoming' | 'launched' | 'discontinued' | 'archived' | 'disabled';
export type EntityLifecycleState = 'upcoming' | 'launched' | 'facelift' | 'discontinued' | 'concept' | 'testing' | 'archived';

export interface EntityStatusHistoryEntry {
  previous_state?: EntityLifecycleState | null;
  state: EntityLifecycleState;
  changed_at: Date;
  changed_by: string;
  reason?: string;
  actor_role?: string;
  otp_verified?: boolean;
  override_used?: boolean;
  request_id?: string;
  approval_status?: string;
}

export interface SEOHistoryEntry {
  field: string;
  old_value: any;
  new_value: any;
  timestamp: Date;
  changed_by: string;
}

export interface VariantHistoryEntry {
  variant_id: string;
  action: 'added' | 'removed' | 'visibility_changed' | 'specs_updated';
  timestamp: Date;
  changed_by: string;
  details?: Record<string, any>;
}

export interface ChangeHistoryEntry {
  field: string;
  old_value: any;
  new_value: any;
  changed_by: string;
  changed_at: Date;
  change_source: 'manual_edit' | 'import' | 'bulk_operation' | 'system' | 'api';
  notes?: string;
}

export interface ICar  {
  car_id: string;
  name: string;
  slug: string;
  brand_id: string;
  body_type_id: string;
  fuel_type_id?: string;
  short_description?: string;
  description: string;
  thumbnail?: {
    url: string;
    alt?: string;
  };
  images?: Array<{
    url: string;
    alt?: string;
  }>;
  gallery_summary?: string;
  status: CarStatus;
  is_upcoming: boolean;
  is_launched: boolean;
  expected_exshowroom_price?: number | null;
  ex_showroom_price?: number | null;
  expected_launch_date?: Date | null;
  exshowroom_price?: number | null;
  launch_date?: Date | null;
  is_electric: boolean;
  is_published: boolean;
  is_deleted: boolean;
  // Soft-archive/disable lifecycle (driven by the deletion-approval workflow)
  archived_at?: Date | null;
  archived_by?: string | null;
  disabled_at?: Date | null;
  disabled_by?: string | null;
  discontinued_at?: Date | null;
  discontinued_by?: string | null;
  // SEO redirect: when set, public lookups 301 to this slug.
  redirect_to_slug?: string | null;
  // Generation/lifecycle (manual model_family — see project plan Gap 1)
  model_family?: string | null;
  generation_start_year?: number | null;
  generation_end_year?: number | null;
  generation_label?: string | null;
  is_current: boolean;
  is_facelift: boolean;
  predecessor_car_id?: string | null;
  successor_car_id?: string | null;
  is_featured: boolean;
  is_popular: boolean;
  is_recommended: boolean;
  is_latest: boolean;
  top_selling: boolean;
  tag_ids: string[];
  // Aggregated mileage / EV-range intelligence (computed from variants)
  best_mileage_class?: MileageClass | null;
  best_mileage_value?: number | null;
  best_range_class?: MileageClass | null;
  best_range_value?: number | null;
  // Aggregated operational intelligence (computed from variants).
  // Maintained by CarAggregationService.recomputeFullAggregates() — the model-level
  // "source of truth derived from variants" promise. MileageRecomputeService is the
  // legacy subset, still called for hot-path mileage recompute.
  variant_count: number;
  // Variants missing one of {transmission_type, price, fuel_type_id}. Operational
  // signal for editors — "this car has 2 variants that customers can't shop".
  incomplete_variant_count: number;
  // Price aggregates
  min_variant_price?: number | null;
  max_variant_price?: number | null;
  min_on_road_price?: number | null;
  max_on_road_price?: number | null;
  min_emi?: number | null;
  max_emi?: number | null;
  // Powertrain aggregates — derived from variant rows
  aggregated_fuel_types?: string[];
  aggregated_transmission_types?: string[];
  aggregated_drive_types?: string[];
  // Distinct human-readable engine signatures, e.g. ["1.2L Petrol 88bhp", "1.5L Diesel 113bhp"]
  engine_options?: string[];
  // Distinct battery capacities in kWh for EVs, e.g. [40.5, 60]
  battery_options?: number[];
  // Performance aggregates (numeric — parsed from variant spec strings)
  power_min_bhp?: number | null;
  power_max_bhp?: number | null;
  torque_min_nm?: number | null;
  torque_max_nm?: number | null;
  mileage_min_kmpl?: number | null;
  mileage_max_kmpl?: number | null;
  range_min_km?: number | null;
  range_max_km?: number | null;
  // Dimension aggregates (typically uniform across variants; pick max where it varies)
  ground_clearance_mm?: number | null;
  boot_space_l?: number | null;
  wheelbase_mm?: number | null;
  max_seating_capacity?: number | null;
  // Feature availability flags — true if ANY variant has it. Drives SEO landing pages
  // like "Cars with sunroof" / "Cars with 360 camera".
  sunroof_available?: boolean;
  adas_available?: boolean;
  ventilated_seats_available?: boolean;
  camera_360_available?: boolean;
  connected_car_available?: boolean;
  wireless_charger_available?: boolean;
  air_purifier_available?: boolean;
  panoramic_sunroof_available?: boolean;
  // Safety aggregates — max() across variants
  max_airbags?: number | null;
  best_ncap_rating?: number | null;
  best_bncap_rating?: number | null;
  best_global_ncap_rating?: number | null;
  best_adas_level?: number | null;
  // Vehicle segment classification (manual; used for SEO/comparisons)
  vehicle_segment?: string | null;
  // AI intelligence flags — derived by rules engine in CarAggregationService.
  // Recompute button overwrites these from rules; editors can manually flip
  // until the next recompute. Hybrid LLM derivation is Batch 3.
  family_friendly?: boolean;
  city_friendly?: boolean;
  highway_friendly?: boolean;
  offroad_ready?: boolean;
  feature_loaded?: boolean;
  premium_cabin?: boolean;
  budget_friendly?: boolean;
  performance_focused?: boolean;
  // SEO/taxonomy keys (free-form; populated by editors or future taxonomy engine)
  seo_tags?: string[];
  buyer_intent_tags?: string[];
  search_intent_tags?: string[];
  // AI intelligence audit subdoc.
  // - confidence_scores: rule-pass confidence per flag (0..1; abs distance from
  //   the decision boundary). Low score = ambiguous → eligible for LLM refinement.
  // - flag_rationale: one-line "why" string for each flag (rules-derived or LLM-derived).
  // - refined_by_llm: keys of flags whose CURRENT verdict came from the LLM rather
  //   than the rules. The next recompute (rules) will clear the LLM verdict for any
  //   flag whose rules confidence rises above the threshold.
  // - last_refined_at: timestamp of the last LLM refinement call.
  ai_intelligence_meta?: {
    confidence_scores?: Record<string, number>;
    flag_rationale?: Record<string, string>;
    refined_by_llm?: string[];
    last_refined_at?: Date | null;
    model_used?: string | null;
  };
  // SEO health and completeness metrics (persisted for filtering/sorting)
  seo_health_issues?: string[];
  completeness_score?: number;
  completeness_misses?: Array<{ key: string; label: string; severity: string }>;
  // Denormalised from the BodyType collection so cars can be sorted alphabetically
  // by body type without a join. Maintained by createCar/updateCar/backfill.
  body_type_name?: string | null;
  // Content ownership
  editor_user_id?: string | null;
  seo_owner_user_id?: string | null;
  reviewer_user_id?: string | null;
  last_reviewed_at?: Date | null;
  // SEO fields
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: string;
  canonical_url?: string;
  noindex?: boolean;
  // Evolutionary lifecycle system
  entity_lifecycle_state?: EntityLifecycleState | null;
  entity_created_at?: Date | null;
  entity_launch_date?: Date | null;
  entity_status_history?: EntityStatusHistoryEntry[];
  seo_history?: SEOHistoryEntry[];
  variant_history?: VariantHistoryEntry[];
  // Change tracking (Batch 6)
  change_history?: ChangeHistoryEntry[];
}

import { BaseModel } from '../sql/common/BaseModel';
export const Car = new BaseModel<ICar>('Cars', 'car_id', [
  'slug_history', 'fuel_types', 'price_range', 'key_specifications', 'aggregates_cache', 'spec_keys_cache',
  'thumbnail', 'images', 'completeness_misses', 'entity_status_history', 'seo_history', 'variant_history', 'change_history'
]);
