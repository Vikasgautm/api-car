import { Document } from 'mongoose';
export interface EnginePerformance {
    engine_type?: string;
    displacement?: string;
    max_power?: string;
    max_torque?: string;
    cylinders?: number;
    valves_per_cylinder?: number;
    fuel_system?: string;
    turbocharger?: boolean;
}
export interface MileageRange {
    arai_mileage?: string;
    city_mileage?: string;
    highway_mileage?: string;
    fuel_tank_capacity?: string;
    emission_standard?: string;
}
export interface BatteryCharging {
    battery_capacity?: string;
    charging_time?: string;
    charging_options?: string[];
    electric_range?: string;
    motor_type?: string;
}
export interface DimensionsPracticality {
    length?: string;
    width?: string;
    height?: string;
    wheelbase?: string;
    ground_clearance?: string;
    boot_space?: string;
    seating_capacity?: number;
    doors?: number;
    kerb_weight?: string;
    gross_vehicle_weight?: string;
}
export interface SuspensionSteeringBrakes {
    front_suspension?: string;
    rear_suspension?: string;
    steering_type?: string;
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
}
export interface Interior {
    dashboard_type?: string;
    instrument_cluster?: string;
    digital_driver_display?: boolean;
    ambient_lighting?: boolean;
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
    roof_rails?: boolean;
    body_color?: string;
    body_type?: string;
    spoiler?: boolean;
    skid_plate?: boolean;
    alloy_wheels_design?: string;
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
}
export type TransmissionType = 'manual' | 'automatic' | 'cvt' | 'dct' | 'amt';
export interface ICarVariant extends Document {
    variant_id: string;
    car_id: string;
    variant_name: string;
    slug: string;
    model_year: number;
    fuel_type_id: string;
    transmission_type: TransmissionType;
    drivetrain?: string;
    seating_capacity?: number;
    ex_showroom_price?: number;
    expected_price?: number;
    expected_launch_date?: Date;
    is_upcoming: boolean;
    specs_normalized?: SpecsNormalized;
    specs_raw?: Record<string, any>;
    hidden_spec_keys?: string[];
    hidden_sections?: string[];
    is_published: boolean;
    is_deleted: boolean;
    is_archived: boolean;
    archived_at?: Date;
    archived_by?: string;
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