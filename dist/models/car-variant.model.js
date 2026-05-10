"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarVariant = void 0;
const mongoose_1 = require("mongoose");
const variantSchema = new mongoose_1.Schema({
    variant_id: { type: String, required: true, unique: true },
    car_id: { type: String, required: true },
    variant_name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    model_year: {
        type: Number,
        required: true,
        min: 1900,
        max: 2100
    },
    fuel_type_id: { type: String },
    transmission_type: {
        type: String,
        enum: ['manual', 'automatic', 'cvt', 'dct', 'amt']
    },
    drivetrain: { type: String },
    seating_capacity: {
        type: Number,
        min: 2,
        max: 10
    },
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
        },
        mileage_range: {
            arai_mileage: String,
            city_mileage: String,
            highway_mileage: String,
            fuel_tank_capacity: String,
            emission_standard: String,
        },
        battery_charging: {
            battery_capacity: String,
            charging_time: String,
            charging_options: [String],
            electric_range: String,
            motor_type: String,
        },
        dimensions_practicality: {
            length: String,
            width: String,
            height: String,
            wheelbase: String,
            ground_clearance: String,
            boot_space: String,
            seating_capacity: { type: Number, min: 2, max: 10 },
            doors: { type: Number, min: 2, max: 5 },
            kerb_weight: String,
            gross_vehicle_weight: String,
        },
        suspension_steering_brakes: {
            front_suspension: String,
            rear_suspension: String,
            steering_type: String,
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
        },
        interior: {
            dashboard_type: String,
            instrument_cluster: String,
            digital_driver_display: Boolean,
            ambient_lighting: Boolean,
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
            roof_rails: Boolean,
            body_color: String,
            body_type: String,
            spoiler: Boolean,
            skid_plate: Boolean,
            alloy_wheels_design: String,
        },
        warranty: {
            basic_warranty_years: { type: Number, min: 0 },
            basic_warranty_km: { type: Number, min: 0 },
            battery_warranty_years: { type: Number, min: 0 },
            battery_warranty_km: { type: Number, min: 0 },
        },
    },
    specs_raw: { type: mongoose_1.Schema.Types.Mixed },
    hidden_spec_keys: { type: [String], default: [] },
    hidden_sections: { type: [String], default: [] },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_archived: { type: Boolean, default: false },
    archived_at: { type: Date },
    archived_by: { type: String },
    // SEO fields
    meta_title: { type: String },
    meta_description: { type: String, maxlength: 160 },
    meta_keywords: { type: String },
    og_image: { type: String },
    canonical_url: { type: String },
    noindex: { type: Boolean, default: false },
}, {
    timestamps: true,
});
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
exports.CarVariant = (0, mongoose_1.model)('CarVariant', variantSchema);
//# sourceMappingURL=car-variant.model.js.map