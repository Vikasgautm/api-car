import { Document } from 'mongoose';
import { MileageClass, MileageSource } from '../constants/mileage-benchmarks';
export interface EnginePerformance {
    engine_type?: string;
    displacement?: string;
    max_power?: string;
    max_torque?: string;
    cylinders?: number;
    valves_per_cylinder?: number;
    fuel_system?: string;
    turbocharger?: boolean;
    supercharger?: boolean;
    gearbox?: string;
    alternate_fuel_type?: string;
    cng_power_torque?: string;
    electric_assist?: string;
    drive_modes?: string;
    terrain_modes?: string;
    acceleration_0_100?: string;
    top_speed?: string;
    idle_start_stop?: boolean;
}
export interface MileageRange {
    arai_mileage?: string;
    city_mileage?: string;
    highway_mileage?: string;
    fuel_tank_capacity?: string;
    emission_standard?: string;
    ethanol_compatibility?: string;
    real_mileage?: string;
    e20_compatibility?: boolean;
    cng_mileage?: string;
    cng_tank_capacity?: string;
}
export interface BatteryCharging {
    battery_capacity?: string;
    battery_capacity_kwh?: number;
    battery_type?: string;
    battery_chemistry?: string;
    battery_position?: string;
    battery_cooling_type?: string;
    charging_time?: string;
    charging_options?: string[];
    electric_range?: string;
    motor_type?: string;
    motor_power_kw?: string;
    motor_torque_nm?: string;
    number_of_motors?: number;
    drivetrain_ev?: string;
    ac_charging_time?: string;
    dc_fast_charging_time?: string;
    fast_charge_0_80?: string;
    charging_port_type?: string;
    max_ac_charging_speed_kw?: number;
    max_dc_charging_speed_kw?: number;
    charging_time_7kw?: string;
    charging_time_50kw?: string;
    regenerative_braking?: boolean;
    regenerative_braking_levels?: number;
    vehicle_to_load?: boolean;
    vehicle_to_vehicle?: boolean;
    real_range?: string;
    real_world_range?: number;
    battery_wltp_km?: number;
    ev_mode?: string;
}
export interface DimensionsPracticality {
    length?: string;
    width?: string;
    height?: string;
    wheelbase?: string;
    ground_clearance?: string;
    boot_space?: string;
    boot_space_folded?: string;
    frunk_space?: string;
    seating_capacity?: number;
    number_of_rows?: number;
    doors?: number;
    kerb_weight?: string;
    gross_vehicle_weight?: string;
}
export interface SuspensionSteeringBrakes {
    front_suspension?: string;
    rear_suspension?: string;
    steering_type?: string;
    steering_adjustment?: string;
    steering_column?: string;
    front_brake_type?: string;
    rear_brake_type?: string;
    parking_brake?: string;
}
export interface TyresWheels {
    tyre_type?: string;
    tyre_size?: string;
    wheel_size?: string;
    alloy_wheels?: boolean;
    spare_tyre?: string;
}
export interface Safety {
    airbags?: number;
    abs?: boolean;
    ebd?: boolean;
    brake_assist?: boolean;
    esp?: boolean;
    traction_control?: boolean;
    hill_hold?: boolean;
    hill_descent?: boolean;
    parking_sensors?: string;
    rear_camera?: boolean;
    camera_360?: boolean;
    isofix?: boolean;
    seat_belt_warning?: boolean;
    speed_alert?: boolean;
    crash_sensor?: boolean;
    engine_immobilizer?: boolean;
    central_locking?: boolean;
    child_safety_lock?: boolean;
    tpms?: boolean;
    ncap_rating?: number;
    bncap_rating?: number;
    global_ncap_rating?: number;
    adas_level?: number;
}
export interface ADAS {
    adaptive_cruise_control?: boolean;
    lane_keep_assist?: boolean;
    lane_departure_warning?: boolean;
    blind_spot_monitoring?: boolean;
    forward_collision_warning?: boolean;
    automatic_emergency_braking?: boolean;
    traffic_sign_recognition?: boolean;
    autonomous_emergency_braking?: boolean;
    rear_cross_traffic_alert?: boolean;
    driver_attention_warning?: boolean;
    adaptive_high_beam_assist?: boolean;
    safe_exit_warning?: boolean;
}
export interface StorageCabinPracticality {
    cupholders_front?: number;
    cupholders_rear?: number;
    bottle_holders?: number;
    cooled_glovebox?: boolean;
    door_pockets?: boolean;
    front_seatback_pockets?: boolean;
    driver_armrest_storage?: boolean;
    rear_armrest?: boolean;
    cabin_boot_access?: boolean;
    sunglass_holder?: boolean;
}
export interface DriverDisplayControls {
    instrument_cluster?: string;
    cluster_size?: string;
    heads_up_display?: boolean;
    gear_indicator?: boolean;
    steering_mounted_controls?: boolean;
    paddle_shifters?: boolean;
    distance_to_empty?: boolean;
    driving_efficiency_display?: boolean;
}
export interface ComfortConvenience {
    climate_control?: string;
    automatic_climate_control?: boolean;
    air_quality_control?: boolean;
    rear_ac_vents?: boolean;
    heated_seats?: string;
    ventilated_seats?: string;
    cooled_glovebox?: boolean;
    steering_adjustment?: string;
    steering_mounted_controls?: boolean;
    cruise_control?: boolean;
    paddle_shifters?: boolean;
    electric_adjustable_seats?: string;
    memory_seats?: string;
    lumbar_support?: boolean;
    seat_material?: string;
    folding_rear_seats?: string;
    remote_start?: boolean;
    keyless_entry?: boolean;
    push_button_start?: boolean;
    power_windows?: string;
    rear_window_defogger?: boolean;
    rear_wiper?: boolean;
    headlamp_washer?: boolean;
}
export interface InfotainmentConnectivity {
    touchscreen?: string;
    android_auto?: boolean;
    apple_carplay?: boolean;
    bluetooth?: boolean;
    usb_ports?: number;
    wireless_charging?: boolean;
    navigation?: boolean;
    voice_command?: boolean;
    speakers?: number;
    wifi_hotspot?: boolean;
    internet_connectivity?: boolean;
    ota_updates?: boolean;
}
export interface ConnectedCar {
    connected_car_tech?: string;
    app_connectivity?: boolean;
    vehicle_tracking?: boolean;
    geofencing?: boolean;
    remote_vehicle_control?: boolean;
    sos_emergency_assist?: boolean;
    find_my_car?: boolean;
    live_location?: boolean;
    remote_engine_start_stop?: boolean;
    remote_lock?: boolean;
    remote_ac?: boolean;
    remote_sunroof?: boolean;
    digital_key?: boolean;
    emergency_sos_button?: boolean;
}
export interface Interior {
    dashboard_type?: string;
    instrument_cluster?: string;
    digital_driver_display?: boolean;
    digital_speedometer?: boolean;
    digital_tachometer?: boolean;
    digital_clock?: boolean;
    interior_theme?: string;
    dashboard_material?: string;
    soft_touch_dashboard?: boolean;
    ambient_lighting?: boolean;
    multi_color_ambient_lighting?: boolean;
    leather_wrapped_steering?: boolean;
    leather_wrapped_gear_knob?: boolean;
    steering_controls?: boolean;
    premium_cabin_materials?: boolean;
    sunroof?: string;
    panoramic_sunroof?: boolean;
    moonroof?: boolean;
    rear_sunblind?: boolean;
    interior_color?: string;
    interior_material?: string;
}
export interface Exterior {
    headlight_type?: string;
    led_headlights?: boolean;
    led_tail_lights?: boolean;
    drl?: boolean;
    fog_lights?: string;
    automatic_headlamps?: boolean;
    follow_me_home?: boolean;
    roof_rails?: boolean;
    body_color?: string;
    body_type?: string;
    spoiler?: boolean;
    skid_plate?: boolean;
    alloy_wheels_design?: string;
    orvm_type?: string;
    orvm_indicators?: boolean;
    rear_wiper?: boolean;
    rear_defogger?: boolean;
    connected_led_taillight?: boolean;
    welcome_goodbye_animation?: boolean;
    flush_door_handles?: boolean;
    rain_sensing_wipers?: boolean;
}
export interface Warranty {
    basic_warranty_years?: number;
    basic_warranty_km?: number;
    battery_warranty_years?: number;
    battery_warranty_km?: number;
}
export interface SpecsNormalized {
    engine_performance?: EnginePerformance;
    mileage_range?: MileageRange;
    battery_charging?: BatteryCharging;
    dimensions_practicality?: DimensionsPracticality;
    suspension_steering_brakes?: SuspensionSteeringBrakes;
    tyres_wheels?: TyresWheels;
    safety?: Safety;
    adas?: ADAS;
    comfort_convenience?: ComfortConvenience;
    infotainment_connectivity?: InfotainmentConnectivity;
    connected_car?: ConnectedCar;
    interior?: Interior;
    exterior?: Exterior;
    warranty?: Warranty;
    storage_cabin_practicality?: StorageCabinPracticality;
    driver_display_controls?: DriverDisplayControls;
}
export type TransmissionType = 'manual' | 'automatic' | 'amt' | 'cvt' | 'dct' | 'dsg' | 'imt' | 'torque_converter' | 'single_speed_ev' | 'e_cvt';
export type VariantMarketStatus = 'available' | 'sold_out' | 'discontinued' | 'upcoming';
export interface ICarVariant extends Document {
    variant_id: string;
    car_id: string;
    variant_name: string;
    slug: string;
    model_year: number;
    fuel_type_id: string;
    transmission_type: TransmissionType;
    drivetrain?: string;
    body_type?: string;
    seating_capacity?: number;
    ex_showroom_price?: number;
    expected_price?: number;
    expected_launch_date?: Date;
    is_upcoming: boolean;
    variant_rank?: number;
    trim_name?: string;
    edition_name?: string;
    on_road_price?: number;
    emi_estimate?: number;
    value_for_money_tag?: boolean;
    best_for_tags?: string[];
    variant_highlights?: string[];
    market_status?: VariantMarketStatus;
    specs_normalized?: SpecsNormalized;
    specs_raw?: Record<string, any>;
    hidden_spec_keys?: string[];
    hidden_sections?: string[];
    is_published: boolean;
    is_deleted: boolean;
    is_archived: boolean;
    archived_at?: Date;
    archived_by?: string;
    mileage_class?: MileageClass | null;
    mileage_class_value?: number | null;
    mileage_class_source?: MileageSource | null;
    range_class?: MileageClass | null;
    range_class_value?: number | null;
    range_class_source?: MileageSource | null;
    editor_user_id?: string | null;
    seo_owner_user_id?: string | null;
    reviewer_user_id?: string | null;
    last_reviewed_at?: Date | null;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_image?: string;
    canonical_url?: string;
    noindex?: boolean;
}
export declare const CarVariant: import("mongoose").Model<ICarVariant, {}, {}, {}, Document<unknown, {}, ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & ICarVariant & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICarVariant>;
//# sourceMappingURL=car-variant.model.d.ts.map