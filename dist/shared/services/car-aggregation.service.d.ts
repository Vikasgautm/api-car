import { ICarVariant } from '../../models/car-variant.model';
export interface CarAggregates {
    variant_count: number;
    incomplete_variant_count: number;
    min_variant_price: number | null;
    max_variant_price: number | null;
    min_on_road_price: number | null;
    max_on_road_price: number | null;
    min_emi: number | null;
    max_emi: number | null;
    aggregated_fuel_types: string[];
    aggregated_transmission_types: string[];
    aggregated_drive_types: string[];
    engine_options: string[];
    battery_options: number[];
    power_min_bhp: number | null;
    power_max_bhp: number | null;
    torque_min_nm: number | null;
    torque_max_nm: number | null;
    mileage_min_kmpl: number | null;
    mileage_max_kmpl: number | null;
    range_min_km: number | null;
    range_max_km: number | null;
    ground_clearance_mm: number | null;
    boot_space_l: number | null;
    wheelbase_mm: number | null;
    max_seating_capacity: number | null;
    sunroof_available: boolean;
    panoramic_sunroof_available: boolean;
    adas_available: boolean;
    ventilated_seats_available: boolean;
    camera_360_available: boolean;
    connected_car_available: boolean;
    wireless_charger_available: boolean;
    air_purifier_available: boolean;
    max_airbags: number | null;
    best_ncap_rating: number | null;
    best_bncap_rating: number | null;
    best_global_ncap_rating: number | null;
    best_adas_level: number | null;
    family_friendly: boolean;
    city_friendly: boolean;
    highway_friendly: boolean;
    offroad_ready: boolean;
    feature_loaded: boolean;
    premium_cabin: boolean;
    budget_friendly: boolean;
    performance_focused: boolean;
    ai_intelligence_meta: {
        confidence_scores: Record<AiFlagKey, number>;
        flag_rationale: Record<AiFlagKey, string>;
        refined_by_llm: AiFlagKey[];
        last_refined_at: Date | null;
        model_used: string | null;
    };
}
export type AiFlagKey = 'family_friendly' | 'city_friendly' | 'highway_friendly' | 'offroad_ready' | 'feature_loaded' | 'premium_cabin' | 'budget_friendly' | 'performance_focused';
export declare const AI_FLAG_KEYS: AiFlagKey[];
export declare const AMBIGUOUS_CONFIDENCE_THRESHOLD = 0.5;
export declare class CarAggregationService {
    /**
     * Compute the full aggregate snapshot for a car from its non-deleted,
     * non-archived variants. Pure: no DB writes. Returns null if the car
     * doesn't exist. Callers persist via `applyAggregates`.
     */
    static computeAggregates(carId: string): Promise<CarAggregates | null>;
    /**
     * Compute aggregates from an already-loaded variant array. Exposed so the
     * import pipeline can aggregate without an extra round-trip.
     */
    static computeAggregatesFromVariants(variants: Array<Partial<ICarVariant>>): CarAggregates;
    /**
     * Persist aggregates onto the Car document. Resolves fuel-type labels here so
     * the pure compute function stays sync.
     *
     * Preserves prior LLM refinements: if a flag was previously refined by Claude
     * and its rule confidence is STILL below the ambiguity threshold, we keep the
     * LLM verdict + rationale. If rule confidence has risen above the threshold,
     * we let the rules win and drop the LLM trail for that flag.
     */
    static applyAggregates(carId: string, agg: CarAggregates): Promise<void>;
    /**
     * One-shot recompute: read variants, compute, write back. The single
     * entry point that variant CRUD / import / admin endpoints should call.
     * Returns the aggregates that were written (or null if the car doesn't exist).
     */
    static recomputeFullAggregates(carId: string): Promise<CarAggregates | null>;
}
