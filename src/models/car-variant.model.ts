import { Document, Schema, model } from 'mongoose';
import { MileageClass, MileageSource } from '../constants/mileage-benchmarks';

export type FieldVisibilityState = 'visible' | 'hidden' | 'partial' | 'teaser_only' | 'estimated';

export interface FieldValue {
  value: any;
  is_estimated?: boolean;
  visibility?: FieldVisibilityState;
  source_confidence?: number;
  label?: string;
}

export interface SectionVisibility {
  section_key: string;
  visibility: FieldVisibilityState;
  hidden_fields?: string[];
}

// Specs normalized interfaces
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

export type TransmissionType =
  | 'manual'
  | 'automatic'
  | 'amt'
  | 'cvt'
  | 'dct'
  | 'dsg'
  | 'imt'
  | 'torque_converter'
  | 'single_speed_ev'
  | 'e_cvt';

export type DriveType =
  | 'fwd'
  | 'rwd'
  | 'awd'
  | '4wd'
  | '2wd'
  | '4x2'
  | '4x4'
  | 'e_awd'
  | 'i_awd'
  | 'dual_motor_awd';

export const DRIVE_TYPE_VALUES: DriveType[] = [
  'fwd', 'rwd', 'awd', '4wd', '2wd', '4x2', '4x4', 'e_awd', 'i_awd', 'dual_motor_awd',
];

// Normalizes free-form drivetrain input (e.g. "FWD", "4WD", "AWD", "front", "e-AWD")
// to a canonical DriveType value, or returns null for unrecognised inputs.
export function normalizeDriveType(raw: string | null | undefined): DriveType | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/\//g, '');
  const aliasMap: Record<string, DriveType> = {
    fwd: 'fwd', front: 'fwd', front_wheel_drive: 'fwd', '2wd': '2wd', '4x2': '4x2',
    rwd: 'rwd', rear: 'rwd', rear_wheel_drive: 'rwd',
    awd: 'awd', all_wheel_drive: 'awd', '4wd': '4wd', four_wheel_drive: '4wd', '4x4': '4x4',
    e_awd: 'e_awd', eawd: 'e_awd', electric_awd: 'e_awd',
    i_awd: 'i_awd', iawd: 'i_awd', intelligent_awd: 'i_awd',
    dual_motor_awd: 'dual_motor_awd', dual_motor: 'dual_motor_awd',
  };
  return aliasMap[key] ?? null;
}

export type VariantMarketStatus = 'available' | 'sold_out' | 'discontinued' | 'upcoming';
export type PublishStatus = 'published' | 'hidden' | 'scheduled' | 'draft';
export type VariantLifecycleStatus = 'launched' | 'upcoming' | 'discontinued' | 'hidden' | 'review_pending' | 'draft' | 'incomplete';

export interface ChangeHistoryEntry {
  field: string;
  old_value: any;
  new_value: any;
  changed_by: string;
  changed_at: Date;
  change_source: 'manual_edit' | 'import' | 'bulk_operation' | 'system' | 'api';
  notes?: string;
}

export interface FieldMetadata {
  value: any;
  source?: string;
  source_priority?: number;
  confidence?: number;
  is_estimated?: boolean;
  last_updated?: Date;
  last_updated_by?: string;
}

export interface ICarVariant extends Document {
  variant_id: string;
  car_id: string;
  variant_name: string;
  slug: string;
  model_year: number;
  fuel_type_id: string;
  transmission_type: TransmissionType;
  drivetrain?: DriveType | string;
  body_type?: string;
  // Powertrain capability flags (enables dynamic category visibility)
  has_engine?: boolean;
  has_battery?: boolean;
  has_motor?: boolean;
  has_external_charging?: boolean;
  powertrain_detection_confidence?: number; // 0-1
  seating_capacity?: number;
  ex_showroom_price?: number;
  expected_price?: number;
  expected_launch_date?: Date;
  is_upcoming: boolean;
  // Buyer-first attributes (Price & Variant Highlights category in the spec)
  variant_rank?: number;
  trim_name?: string;
  edition_name?: string;
  on_road_price?: number;
  emi_estimate?: number;
  value_for_money_tag?: boolean;
  best_for_tags?: string[];
  variant_highlights?: string[];
  market_status?: VariantMarketStatus;
  publish_status?: PublishStatus;
  variant_status?: VariantLifecycleStatus;
  // Field-level visibility and estimation tracking
  field_visibility?: Record<string, FieldVisibilityState>;
  section_visibility?: SectionVisibility[];
  estimated_fields?: Record<string, boolean>;
  field_confidence_scores?: Record<string, number>;
  specs_normalized?: SpecsNormalized;
  specs_raw?: Record<string, any>;
  specs_metadata?: Record<string, FieldMetadata>;
  hidden_spec_keys?: string[];
  hidden_sections?: string[];
  // Unified visibility override system (maps category/field names to 'auto' | 'manual-show' | 'manual-hide')
  visibility_overrides?: Record<string, 'auto' | 'manual-show' | 'manual-hide'>;
  is_published: boolean;
  is_deleted: boolean;
  is_archived: boolean;
  archived_at?: Date;
  archived_by?: string;
  // Mileage / EV-range intelligence (auto-computed; see MileageClassifierService)
  mileage_class?: MileageClass | null;
  mileage_class_value?: number | null;
  mileage_class_source?: MileageSource | null;
  range_class?: MileageClass | null;
  range_class_value?: number | null;
  range_class_source?: MileageSource | null;
  // Content ownership
  editor_user_id?: string | null;
  seo_owner_user_id?: string | null;
  reviewer_user_id?: string | null;
  last_reviewed_at?: Date | null;
  // Change tracking (Batch 6)
  change_history?: ChangeHistoryEntry[];
  // SEO fields
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: string;
  canonical_url?: string;
  noindex?: boolean;
  // Comparison fields
  isMostComparedVariant?: boolean;
  mostComparedPriority?: number;
}

const variantSchema = new Schema<ICarVariant>(
  {
    variant_id: { type: String, required: true, unique: true },
    car_id: { type: String, required: true },
    variant_name: { type: String, required: true },
    slug: { type: String, required: true },
    model_year: {
      type: Number,
      required: true,
      min: 1900,
      max: 2100
    },
    fuel_type_id: { type: String },
    transmission_type: {
      type: String,
      enum: [
        'manual',
        'automatic',
        'amt',
        'cvt',
        'dct',
        'dsg',
        'imt',
        'torque_converter',
        'single_speed_ev',
        'e_cvt',
      ],
    },
    drivetrain: { type: String, enum: [...DRIVE_TYPE_VALUES, null, undefined] },
    body_type: { type: String },
    // Powertrain capability flags (enables dynamic category visibility)
    has_engine: { type: Boolean, default: false },
    has_battery: { type: Boolean, default: false },
    has_motor: { type: Boolean, default: false },
    has_external_charging: { type: Boolean, default: false },
    powertrain_detection_confidence: { type: Number, default: 0, min: 0, max: 1 },
    seating_capacity: { type: Number, min: 2, max: 10 },
    ex_showroom_price: { 
      type: Number,
      min: 0
    },
    expected_price: { 
      type: Number,
      min: 0
    },
    expected_launch_date: { type: Date },
    is_upcoming: { type: Boolean, default: false },
    variant_rank: { type: Number, default: null, min: 0 },
    trim_name: { type: String, default: null, trim: true },
    edition_name: { type: String, default: null, trim: true },
    on_road_price: { type: Number, default: null, min: 0 },
    emi_estimate: { type: Number, default: null, min: 0 },
    value_for_money_tag: { type: Boolean, default: false },
    best_for_tags: { type: [String], default: [] },
    variant_highlights: { type: [String], default: [] },
    market_status: {
      type: String,
      enum: ['available', 'sold_out', 'discontinued', 'upcoming', null],
      default: null,
    },
    // Field-level visibility and estimation tracking
    field_visibility: { type: Schema.Types.Mixed, default: {} },
    section_visibility: [{
      section_key: { type: String, required: true },
      visibility: {
        type: String,
        enum: ['visible', 'hidden', 'partial', 'teaser_only', 'estimated'],
        default: 'visible',
      },
      hidden_fields: { type: [String], default: [] },
    }],
    estimated_fields: { type: Schema.Types.Mixed, default: {} },
    field_confidence_scores: { type: Schema.Types.Mixed, default: {} },
    specs_normalized: {
      engine_performance: {
        engine_type: String,
        displacement: String,
        max_power: String,
        max_torque: String,
        cylinders: { type: Number, min: 0 },
        valves_per_cylinder: { type: Number, min: 0 },
        compression_ratio: String,
        fuel_system: String,
        turbocharger: Boolean,
        supercharger: Boolean,
        gearbox: String,
        alternate_fuel_type: String,
        cng_power_torque: String,
        electric_assist: String,
        drive_modes: String,
        terrain_modes: String,
        acceleration_0_100: String,
        top_speed: String,
        idle_start_stop: Boolean,
      },
      mileage_range: {
        arai_mileage: String,
        city_mileage: String,
        highway_mileage: String,
        fuel_tank_capacity: String,
        emission_standard: String,
        ethanol_compatibility: String,
        real_mileage: String,
        e20_compatibility: Boolean,
        cng_mileage: String,
        cng_tank_capacity: String,
      },
      battery_charging: {
        battery_capacity: String,
        battery_capacity_kwh: { type: Number, min: 0 },
        battery_type: String,
        battery_chemistry: String,
        battery_position: String,
        battery_cooling_type: String,
        charging_time: String,
        charging_options: [String],
        electric_range: String,
        motor_type: String,
        motor_power_kw: String,
        motor_torque_nm: String,
        number_of_motors: { type: Number, min: 0 },
        drivetrain_ev: String,
        ac_charging_time: String,
        dc_fast_charging_time: String,
        fast_charge_0_80: String,
        charging_port_type: String,
        max_ac_charging_speed_kw: { type: Number, min: 0 },
        max_dc_charging_speed_kw: { type: Number, min: 0 },
        charging_time_7kw: String,
        charging_time_50kw: String,
        regenerative_braking: Boolean,
        regenerative_braking_levels: { type: Number, min: 0 },
        vehicle_to_load: Boolean,
        vehicle_to_vehicle: Boolean,
        real_range: String,
        real_world_range: { type: Number, min: 0 },
        battery_wltp_km: { type: Number, min: 0 },
        ev_mode: String,
      },
      dimensions_practicality: {
        length: String,
        width: String,
        height: String,
        wheelbase: String,
        ground_clearance: String,
        boot_space: String,
        boot_space_folded: String,
        frunk_space: String,
        seating_capacity: { type: Number, min: 2, max: 10 },
        number_of_rows: { type: Number, min: 1, max: 4 },
        doors: { type: Number, min: 2, max: 5 },
        kerb_weight: String,
        gross_vehicle_weight: String,
      },
      suspension_steering_brakes: {
        front_suspension: String,
        rear_suspension: String,
        steering_type: String,
        steering_adjustment: String,
        steering_column: String,
        front_brake_type: String,
        rear_brake_type: String,
        parking_brake: String,
      },
      tyres_wheels: {
        tyre_type: String,
        tyre_size: String,
        wheel_size: String,
        alloy_wheels: Boolean,
        spare_tyre: String,
      },
      safety: {
        airbags: { type: Number, min: 0 },
        abs: Boolean,
        ebd: Boolean,
        brake_assist: Boolean,
        esp: Boolean,
        traction_control: Boolean,
        hill_hold: Boolean,
        hill_descent: Boolean,
        parking_sensors: String,
        rear_camera: Boolean,
        camera_360: Boolean,
        isofix: Boolean,
        seat_belt_warning: Boolean,
        speed_alert: Boolean,
        crash_sensor: Boolean,
        engine_immobilizer: Boolean,
        central_locking: Boolean,
        child_safety_lock: Boolean,
        tpms: Boolean,
        ncap_rating: { type: Number, min: 0, max: 5 },
        bncap_rating: { type: Number, min: 0, max: 5 },
        global_ncap_rating: { type: Number, min: 0, max: 5 },
        adas_level: { type: Number, min: 0, max: 5 },
      },
      adas: {
        adaptive_cruise_control: Boolean,
        lane_keep_assist: Boolean,
        lane_departure_warning: Boolean,
        blind_spot_monitoring: Boolean,
        forward_collision_warning: Boolean,
        automatic_emergency_braking: Boolean,
        traffic_sign_recognition: Boolean,
        autonomous_emergency_braking: Boolean,
        rear_cross_traffic_alert: Boolean,
        driver_attention_warning: Boolean,
        adaptive_high_beam_assist: Boolean,
        safe_exit_warning: Boolean,
      },
      comfort_convenience: {
        climate_control: String,
        automatic_climate_control: Boolean,
        air_quality_control: Boolean,
        rear_ac_vents: Boolean,
        heated_seats: String,
        ventilated_seats: String,
        cooled_glovebox: Boolean,
        steering_adjustment: String,
        steering_mounted_controls: Boolean,
        cruise_control: Boolean,
        paddle_shifters: Boolean,
        electric_adjustable_seats: String,
        memory_seats: String,
        lumbar_support: Boolean,
        seat_material: String,
        folding_rear_seats: String,
        remote_start: Boolean,
        keyless_entry: Boolean,
        push_button_start: Boolean,
        power_windows: String,
        rear_window_defogger: Boolean,
        rear_wiper: Boolean,
        headlamp_washer: Boolean,
      },
      infotainment_connectivity: {
        touchscreen: String,
        android_auto: Boolean,
        apple_carplay: Boolean,
        bluetooth: Boolean,
        usb_ports: { type: Number, min: 0 },
        wireless_charging: Boolean,
        navigation: Boolean,
        voice_command: Boolean,
        speakers: { type: Number, min: 0 },
        wifi_hotspot: Boolean,
        internet_connectivity: Boolean,
        ota_updates: Boolean,
      },
      connected_car: {
        connected_car_tech: String,
        app_connectivity: Boolean,
        vehicle_tracking: Boolean,
        geofencing: Boolean,
        remote_vehicle_control: Boolean,
        sos_emergency_assist: Boolean,
        find_my_car: Boolean,
        live_location: Boolean,
        remote_engine_start_stop: Boolean,
        remote_lock: Boolean,
        remote_ac: Boolean,
        remote_sunroof: Boolean,
        digital_key: Boolean,
        emergency_sos_button: Boolean,
      },
      interior: {
        dashboard_type: String,
        instrument_cluster: String,
        digital_driver_display: Boolean,
        digital_speedometer: Boolean,
        digital_tachometer: Boolean,
        digital_clock: Boolean,
        interior_theme: String,
        dashboard_material: String,
        soft_touch_dashboard: Boolean,
        ambient_lighting: Boolean,
        multi_color_ambient_lighting: Boolean,
        leather_wrapped_steering: Boolean,
        leather_wrapped_gear_knob: Boolean,
        steering_controls: Boolean,
        premium_cabin_materials: Boolean,
        sunroof: String,
        panoramic_sunroof: Boolean,
        moonroof: Boolean,
        rear_sunblind: Boolean,
        interior_color: String,
        interior_material: String,
      },
      exterior: {
        headlight_type: String,
        led_headlights: Boolean,
        led_tail_lights: Boolean,
        drl: Boolean,
        fog_lights: String,
        automatic_headlamps: Boolean,
        follow_me_home: Boolean,
        roof_rails: Boolean,
        body_color: String,
        body_type: String,
        spoiler: Boolean,
        skid_plate: Boolean,
        alloy_wheels_design: String,
        orvm_type: String,
        orvm_indicators: Boolean,
        rear_wiper: Boolean,
        rear_defogger: Boolean,
        connected_led_taillight: Boolean,
        welcome_goodbye_animation: Boolean,
        flush_door_handles: Boolean,
        rain_sensing_wipers: Boolean,
      },
      warranty: {
        basic_warranty_years: { type: Number, min: 0 },
        basic_warranty_km: { type: Number, min: 0 },
        battery_warranty_years: { type: Number, min: 0 },
        battery_warranty_km: { type: Number, min: 0 },
      },
      storage_cabin_practicality: {
        cupholders_front: { type: Number, min: 0 },
        cupholders_rear: { type: Number, min: 0 },
        bottle_holders: { type: Number, min: 0 },
        cooled_glovebox: Boolean,
        door_pockets: Boolean,
        front_seatback_pockets: Boolean,
        driver_armrest_storage: Boolean,
        rear_armrest: Boolean,
        cabin_boot_access: Boolean,
        sunglass_holder: Boolean,
      },
      driver_display_controls: {
        instrument_cluster: String,
        cluster_size: String,
        heads_up_display: Boolean,
        gear_indicator: Boolean,
        steering_mounted_controls: Boolean,
        paddle_shifters: Boolean,
        distance_to_empty: Boolean,
        driving_efficiency_display: Boolean,
      },
    },
    specs_raw: { type: Schema.Types.Mixed },
    specs_metadata: { type: Schema.Types.Mixed, default: {} },
    hidden_spec_keys: { type: [String], default: [] },
    hidden_sections: { type: [String], default: [] },
    visibility_overrides: { type: Schema.Types.Mixed, default: {} },
    is_published: { type: Boolean, default: false },
    publish_status: { type: String, enum: ['published', 'hidden', 'scheduled', 'draft'], default: 'draft' },
    variant_status: { type: String, enum: ['launched', 'upcoming', 'discontinued', 'hidden', 'review_pending', 'draft', 'incomplete'], default: 'draft' },
    is_deleted: { type: Boolean, default: false },
    is_archived: { type: Boolean, default: false },
    archived_at: { type: Date },
    archived_by: { type: String },
    mileage_class: { type: String, enum: ['weak', 'average', 'good', 'excellent', null], default: null },
    mileage_class_value: { type: Number, default: null },
    mileage_class_source: { type: String, default: null },
    range_class: { type: String, enum: ['weak', 'average', 'good', 'excellent', null], default: null },
    range_class_value: { type: Number, default: null },
    range_class_source: { type: String, default: null },
    editor_user_id: { type: String, default: null },
    seo_owner_user_id: { type: String, default: null },
    reviewer_user_id: { type: String, default: null },
    last_reviewed_at: { type: Date, default: null },
    // SEO fields
    meta_title: { type: String },
    meta_description: { type: String, maxlength: 160 },
    meta_keywords: { type: String },
    og_image: { type: String },
    canonical_url: { type: String },
    noindex: { type: Boolean, default: false },
    isMostComparedVariant: { type: Boolean, default: false, index: true },
    mostComparedPriority: { type: Number, default: 0, min: 0 },
    change_history: [{
      field: { type: String, required: true },
      old_value: { type: Schema.Types.Mixed },
      new_value: { type: Schema.Types.Mixed },
      changed_by: { type: String, required: true },
      changed_at: { type: Date, required: true },
      change_source: {
        type: String,
        enum: ['manual_edit', 'import', 'bulk_operation', 'system', 'api'],
        required: true,
      },
      notes: { type: String },
    }],
  },
  {
    timestamps: true,
  }
);

variantSchema.index({ car_id: 1 });
variantSchema.index({ fuel_type_id: 1 });
variantSchema.index({ transmission_type: 1 });
variantSchema.index({ model_year: 1 });
variantSchema.index({ is_published: 1, is_deleted: 1 });
variantSchema.index({ is_archived: 1 });
variantSchema.index({ variant_name: 'text' });
variantSchema.index({ car_id: 1, is_published: 1, is_deleted: 1, is_archived: 1 });
variantSchema.index({ expected_launch_date: 1, is_published: 1, is_deleted: 1, is_archived: 1 });
variantSchema.index({ ex_showroom_price: 1, is_published: 1, is_deleted: 1, is_archived: 1 });
variantSchema.index({ expected_price: 1, is_published: 1, is_deleted: 1, is_archived: 1 });
variantSchema.index({ mileage_class: 1 });
variantSchema.index({ range_class: 1 });
variantSchema.index({ editor_user_id: 1 });
variantSchema.index({ seo_owner_user_id: 1 });
variantSchema.index({ reviewer_user_id: 1 });
variantSchema.index({ last_reviewed_at: -1 });
// Additional compound indexes for common query patterns
variantSchema.index({ car_id: 1, fuel_type_id: 1, is_published: 1, is_deleted: 1, is_archived: 1 });
variantSchema.index({ car_id: 1, transmission_type: 1, is_published: 1, is_deleted: 1, is_archived: 1 });
variantSchema.index({ car_id: 1, model_year: 1, is_published: 1, is_deleted: 1, is_archived: 1 });
variantSchema.index({ ex_showroom_price: 1, car_id: 1, is_published: 1, is_deleted: 1, is_archived: 1 });
variantSchema.index({ mileage_class: 1, is_published: 1, is_deleted: 1, is_archived: 1 });
variantSchema.index({ range_class: 1, is_published: 1, is_deleted: 1, is_archived: 1 });
variantSchema.index({ car_id: 1, variant_rank: 1, is_published: 1, is_deleted: 1, is_archived: 1 });
variantSchema.index({ value_for_money_tag: 1 });
variantSchema.index({ market_status: 1 });
variantSchema.index({ on_road_price: 1, is_published: 1, is_deleted: 1, is_archived: 1 });

// Slug must be unique only among non-deleted variants so admins can reuse the slug
// of a soft-deleted variant. In production, drop the old index first:
// db.carvariants.dropIndex("slug_1")
variantSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { is_deleted: false }, name: 'uniq_slug_active' }
);

export const CarVariant = model<ICarVariant>('CarVariant', variantSchema);
