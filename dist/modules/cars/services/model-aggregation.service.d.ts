export interface ModelAggregates {
    car_id: string;
    price_range_min?: number;
    price_range_max?: number;
    available_fuel_types?: string[];
    available_transmissions?: string[];
    available_drivetrains?: string[];
    min_power_bhp?: number;
    max_power_bhp?: number;
    min_torque_nm?: number;
    max_torque_nm?: number;
    min_range_km?: number;
    max_range_km?: number;
    has_sunroof?: boolean;
    has_panoramic_sunroof?: boolean;
    has_adas?: boolean;
    has_ventilated_seats?: boolean;
    has_camera_360?: boolean;
    has_connected_car?: boolean;
    has_wireless_charger?: boolean;
    has_android_auto?: boolean;
    has_apple_carplay?: boolean;
    has_led_headlights?: boolean;
    min_seating_capacity?: number;
    max_seating_capacity?: number;
    best_ncap_rating?: number;
    variant_count?: number;
    published_variant_count?: number;
    body_type?: string;
    brand_name?: string;
    car_name?: string;
}
export declare class ModelAggregationService {
    /**
     * Aggregate all variant specs into model-level aggregates.
     * Used to populate summary cards and filter facets.
     */
    static aggregateModelFromVariants(carId: string): Promise<ModelAggregates>;
    /**
     * Batch aggregate for multiple cars — runs all aggregations in parallel.
     */
    static aggregateMultipleCars(carIds: string[]): Promise<ModelAggregates[]>;
}
//# sourceMappingURL=model-aggregation.service.d.ts.map