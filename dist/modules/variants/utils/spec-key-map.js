"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INVALID_LABELS = exports.SPEC_LABEL_MAP = void 0;
exports.normalizeLabel = normalizeLabel;
exports.isInvalidLabel = isInvalidLabel;
exports.getSpecMapping = getSpecMapping;
exports.parseSpecValue = parseSpecValue;
exports.guessCategory = guessCategory;
exports.deriveFeatureFlags = deriveFeatureFlags;
// Helper builders to keep entries compact and consistent.
const norm = (category, key, subPath, type) => ({
    category,
    key,
    path: `specs_normalized.${subPath}`,
    type,
});
const raw = (category, key, type) => ({
    category,
    key,
    path: `specs_raw.${key}`,
    type,
});
// ============================================================================
// SPEC_LABEL_MAP — canonical mapping from CarDekho-style labels to internal paths.
// Keys MUST be the output of normalizeLabel() (lowercase, & → and, non-alphanum → space).
// When a value lands in a typed field (boolean/number), parseSpecValue normalises it.
// When it lands in specs_raw, the original string is preserved verbatim.
// ============================================================================
exports.SPEC_LABEL_MAP = {
    // ─── ENGINE & TRANSMISSION ────────────────────────────────────────────────
    'engine type': norm('engine_performance', 'engine_type', 'engine_performance.engine_type', 'string'),
    'displacement': norm('engine_performance', 'displacement', 'engine_performance.displacement', 'string'),
    'max power': norm('engine_performance', 'max_power', 'engine_performance.max_power', 'string'),
    'max torque': norm('engine_performance', 'max_torque', 'engine_performance.max_torque', 'string'),
    'no of cylinders': norm('engine_performance', 'cylinders', 'engine_performance.cylinders', 'number'),
    'number of cylinders': norm('engine_performance', 'cylinders', 'engine_performance.cylinders', 'number'),
    'valves per cylinder': norm('engine_performance', 'valves_per_cylinder', 'engine_performance.valves_per_cylinder', 'number'),
    'fuel supply system': norm('engine_performance', 'fuel_system', 'engine_performance.fuel_system', 'string'),
    'turbo charger': norm('engine_performance', 'turbocharger', 'engine_performance.turbocharger', 'boolean'),
    'turbocharger': norm('engine_performance', 'turbocharger', 'engine_performance.turbocharger', 'boolean'),
    // Promoted to typed schema home (was specs_raw.super_charger before Batch 1+2).
    'super charger': norm('engine_performance', 'supercharger', 'engine_performance.supercharger', 'boolean'),
    'supercharger': norm('engine_performance', 'supercharger', 'engine_performance.supercharger', 'boolean'),
    'compression ratio': raw('engine_performance', 'compression_ratio', 'string'),
    'transmission type': { category: 'engine_performance', key: 'transmission_type', rootKey: 'transmission_type', type: 'transmission' },
    'gearbox': raw('engine_performance', 'gearbox', 'string'),
    'drive type': { category: 'engine_performance', key: 'drivetrain', rootKey: 'drivetrain', type: 'string' },
    'fuel type': { category: 'engine_performance', key: 'fuel_type', rootKey: 'fuel_type', type: 'string' },
    'idle start stop system': norm('engine_performance', 'idle_start_stop', 'engine_performance.idle_start_stop', 'boolean'),
    'idle start stop': norm('engine_performance', 'idle_start_stop', 'engine_performance.idle_start_stop', 'boolean'),
    'top speed': norm('engine_performance', 'top_speed', 'engine_performance.top_speed', 'string'),
    'acceleration 0100kmph': norm('engine_performance', 'acceleration_0_100', 'engine_performance.acceleration_0_100', 'string'),
    'acceleration 0 100 kmph': norm('engine_performance', 'acceleration_0_100', 'engine_performance.acceleration_0_100', 'string'),
    // ─── FUEL & PERFORMANCE / MILEAGE ─────────────────────────────────────────
    'petrol fuel tank capacity': norm('mileage_range', 'fuel_tank_capacity', 'mileage_range.fuel_tank_capacity', 'string'),
    'diesel fuel tank capacity': norm('mileage_range', 'fuel_tank_capacity', 'mileage_range.fuel_tank_capacity', 'string'),
    'fuel tank capacity': norm('mileage_range', 'fuel_tank_capacity', 'mileage_range.fuel_tank_capacity', 'string'),
    'emission norm compliance': norm('mileage_range', 'emission_standard', 'mileage_range.emission_standard', 'string'),
    'arai mileage': norm('mileage_range', 'arai_mileage', 'mileage_range.arai_mileage', 'string'),
    'mileage arai': norm('mileage_range', 'arai_mileage', 'mileage_range.arai_mileage', 'string'),
    'city mileage': norm('mileage_range', 'city_mileage', 'mileage_range.city_mileage', 'string'),
    'mileage city': norm('mileage_range', 'city_mileage', 'mileage_range.city_mileage', 'string'),
    'highway mileage': norm('mileage_range', 'highway_mileage', 'mileage_range.highway_mileage', 'string'),
    'mileage highway': norm('mileage_range', 'highway_mileage', 'mileage_range.highway_mileage', 'string'),
    'cng mileage': norm('mileage_range', 'cng_mileage', 'mileage_range.cng_mileage', 'string'),
    'cng tank capacity': norm('mileage_range', 'cng_tank_capacity', 'mileage_range.cng_tank_capacity', 'string'),
    'e20 fuel compatibility': norm('mileage_range', 'e20_compatibility', 'mileage_range.e20_compatibility', 'boolean'),
    // ─── BATTERY & CHARGING (EV) ─────────────────────────────────────────────
    'battery capacity': norm('battery_charging', 'battery_capacity', 'battery_charging.battery_capacity', 'string'),
    'range': norm('battery_charging', 'electric_range', 'battery_charging.electric_range', 'string'),
    'electric range': norm('battery_charging', 'electric_range', 'battery_charging.electric_range', 'string'),
    'motor type': norm('battery_charging', 'motor_type', 'battery_charging.motor_type', 'string'),
    'motor power': raw('battery_charging', 'motor_power', 'string'),
    'charging time': norm('battery_charging', 'charging_time', 'battery_charging.charging_time', 'string'),
    'charging options': norm('battery_charging', 'charging_options', 'battery_charging.charging_options', 'array'),
    'charging time ac': raw('battery_charging', 'charging_time_ac', 'string'),
    'charging time dc': raw('battery_charging', 'charging_time_dc', 'string'),
    'battery type': raw('battery_charging', 'battery_type', 'string'),
    'charging port': raw('battery_charging', 'charging_port', 'string'),
    'fast charging': raw('battery_charging', 'fast_charging', 'boolean'),
    'regenerative braking': norm('battery_charging', 'regenerative_braking', 'battery_charging.regenerative_braking', 'boolean'),
    // Promoted to typed schema home (was specs_raw before Batch 1+2).
    'regenerative braking levels': norm('battery_charging', 'regenerative_braking_levels', 'battery_charging.regenerative_braking_levels', 'number'),
    // Batch 1+2 — new typed battery atoms.
    'battery capacity kwh': norm('battery_charging', 'battery_capacity_kwh', 'battery_charging.battery_capacity_kwh', 'number'),
    'battery chemistry': norm('battery_charging', 'battery_chemistry', 'battery_charging.battery_chemistry', 'string'),
    'battery position': norm('battery_charging', 'battery_position', 'battery_charging.battery_position', 'string'),
    'battery placement': norm('battery_charging', 'battery_position', 'battery_charging.battery_position', 'string'),
    'battery cooling type': norm('battery_charging', 'battery_cooling_type', 'battery_charging.battery_cooling_type', 'string'),
    'battery cooling': norm('battery_charging', 'battery_cooling_type', 'battery_charging.battery_cooling_type', 'string'),
    'max ac charging speed': norm('battery_charging', 'max_ac_charging_speed_kw', 'battery_charging.max_ac_charging_speed_kw', 'number'),
    'maximum ac charging speed': norm('battery_charging', 'max_ac_charging_speed_kw', 'battery_charging.max_ac_charging_speed_kw', 'number'),
    'max dc charging speed': norm('battery_charging', 'max_dc_charging_speed_kw', 'battery_charging.max_dc_charging_speed_kw', 'number'),
    'maximum dc charging speed': norm('battery_charging', 'max_dc_charging_speed_kw', 'battery_charging.max_dc_charging_speed_kw', 'number'),
    // ─── SUSPENSION, STEERING & BRAKES ────────────────────────────────────────
    'front suspension': norm('suspension_steering_brakes', 'front_suspension', 'suspension_steering_brakes.front_suspension', 'string'),
    'rear suspension': norm('suspension_steering_brakes', 'rear_suspension', 'suspension_steering_brakes.rear_suspension', 'string'),
    'steering type': norm('suspension_steering_brakes', 'steering_type', 'suspension_steering_brakes.steering_type', 'string'),
    'steering column': norm('suspension_steering_brakes', 'steering_column', 'suspension_steering_brakes.steering_column', 'string'),
    'front brake type': norm('suspension_steering_brakes', 'front_brake_type', 'suspension_steering_brakes.front_brake_type', 'string'),
    'rear brake type': norm('suspension_steering_brakes', 'rear_brake_type', 'suspension_steering_brakes.rear_brake_type', 'string'),
    'parking brake': norm('suspension_steering_brakes', 'parking_brake', 'suspension_steering_brakes.parking_brake', 'string'),
    'shock absorbers type': raw('suspension_steering_brakes', 'shock_absorbers_type', 'string'),
    'turning radius': raw('suspension_steering_brakes', 'turning_radius', 'string'),
    // ─── DIMENSIONS & CAPACITY ────────────────────────────────────────────────
    'length': norm('dimensions_practicality', 'length', 'dimensions_practicality.length', 'string'),
    'width': norm('dimensions_practicality', 'width', 'dimensions_practicality.width', 'string'),
    'height': norm('dimensions_practicality', 'height', 'dimensions_practicality.height', 'string'),
    'wheel base': norm('dimensions_practicality', 'wheelbase', 'dimensions_practicality.wheelbase', 'string'),
    'wheelbase': norm('dimensions_practicality', 'wheelbase', 'dimensions_practicality.wheelbase', 'string'),
    'ground clearance unladen': norm('dimensions_practicality', 'ground_clearance', 'dimensions_practicality.ground_clearance', 'string'),
    'ground clearance': norm('dimensions_practicality', 'ground_clearance', 'dimensions_practicality.ground_clearance', 'string'),
    'boot space': norm('dimensions_practicality', 'boot_space', 'dimensions_practicality.boot_space', 'string'),
    'boot space rear seat folding': norm('dimensions_practicality', 'boot_space_folded', 'dimensions_practicality.boot_space_folded', 'string'),
    'frunk space': norm('dimensions_practicality', 'frunk_space', 'dimensions_practicality.frunk_space', 'string'),
    'kerb weight': norm('dimensions_practicality', 'kerb_weight', 'dimensions_practicality.kerb_weight', 'string'),
    'gross weight': norm('dimensions_practicality', 'gross_vehicle_weight', 'dimensions_practicality.gross_vehicle_weight', 'string'),
    'gross vehicle weight': norm('dimensions_practicality', 'gross_vehicle_weight', 'dimensions_practicality.gross_vehicle_weight', 'string'),
    'seating capacity': {
        category: 'dimensions_practicality',
        key: 'seating_capacity',
        path: 'specs_normalized.dimensions_practicality.seating_capacity',
        rootKey: 'seating_capacity',
        type: 'number',
    },
    'no of doors': norm('dimensions_practicality', 'doors', 'dimensions_practicality.doors', 'number'),
    'number of doors': norm('dimensions_practicality', 'doors', 'dimensions_practicality.doors', 'number'),
    'no of rows': norm('dimensions_practicality', 'number_of_rows', 'dimensions_practicality.number_of_rows', 'number'),
    'number of rows': norm('dimensions_practicality', 'number_of_rows', 'dimensions_practicality.number_of_rows', 'number'),
    // ─── TYRES & WHEELS ───────────────────────────────────────────────────────
    'tyre size': norm('tyres_wheels', 'tyre_size', 'tyres_wheels.tyre_size', 'string'),
    'tyre type': norm('tyres_wheels', 'tyre_type', 'tyres_wheels.tyre_type', 'string'),
    'wheel size': norm('tyres_wheels', 'wheel_size', 'tyres_wheels.wheel_size', 'string'),
    'alloy wheels': norm('tyres_wheels', 'alloy_wheels', 'tyres_wheels.alloy_wheels', 'boolean'),
    'spare tyre': norm('tyres_wheels', 'spare_tyre', 'tyres_wheels.spare_tyre', 'string'),
    'wheel covers': raw('tyres_wheels', 'wheel_covers', 'boolean'),
    // ─── SAFETY ───────────────────────────────────────────────────────────────
    'no of airbags': norm('safety', 'airbags', 'safety.airbags', 'number'),
    'number of airbags': norm('safety', 'airbags', 'safety.airbags', 'number'),
    'driver airbag': raw('safety', 'driver_airbag', 'boolean'),
    'passenger airbag': raw('safety', 'passenger_airbag', 'boolean'),
    'side airbag': raw('safety', 'side_airbag', 'boolean'),
    'curtain airbag': raw('safety', 'curtain_airbag', 'boolean'),
    'knee airbag': raw('safety', 'knee_airbag', 'boolean'),
    'anti lock braking system abs': norm('safety', 'abs', 'safety.abs', 'boolean'),
    'abs': norm('safety', 'abs', 'safety.abs', 'boolean'),
    'brake assist': norm('safety', 'brake_assist', 'safety.brake_assist', 'boolean'),
    'central locking': norm('safety', 'central_locking', 'safety.central_locking', 'boolean'),
    'child safety locks': norm('safety', 'child_safety_lock', 'safety.child_safety_lock', 'boolean'),
    'child safety lock': norm('safety', 'child_safety_lock', 'safety.child_safety_lock', 'boolean'),
    'anti theft alarm': raw('safety', 'anti_theft_alarm', 'boolean'),
    'day and night rear view mirror': raw('safety', 'day_night_rear_view_mirror', 'boolean'),
    'day night rear view mirror': raw('safety', 'day_night_rear_view_mirror', 'boolean'),
    'electronic brakeforce distribution ebd': norm('safety', 'ebd', 'safety.ebd', 'boolean'),
    'ebd': norm('safety', 'ebd', 'safety.ebd', 'boolean'),
    'seat belt warning': norm('safety', 'seat_belt_warning', 'safety.seat_belt_warning', 'boolean'),
    'door ajar warning': raw('safety', 'door_ajar_warning', 'boolean'),
    'traction control': norm('safety', 'traction_control', 'safety.traction_control', 'boolean'),
    // Promoted to typed schema home (was specs_raw before Batch 1+2).
    'tyre pressure monitoring system tpms': norm('safety', 'tpms', 'safety.tpms', 'boolean'),
    'tpms': norm('safety', 'tpms', 'safety.tpms', 'boolean'),
    'engine immobilizer': norm('safety', 'engine_immobilizer', 'safety.engine_immobilizer', 'boolean'),
    'electronic stability control esc': norm('safety', 'esp', 'safety.esp', 'boolean'),
    'esc': norm('safety', 'esp', 'safety.esp', 'boolean'),
    'esp': norm('safety', 'esp', 'safety.esp', 'boolean'),
    'parking sensors': norm('safety', 'parking_sensors', 'safety.parking_sensors', 'string'),
    'rear camera': norm('safety', 'rear_camera', 'safety.rear_camera', 'boolean'),
    'speed alert': norm('safety', 'speed_alert', 'safety.speed_alert', 'boolean'),
    'speed sensing auto door lock': raw('safety', 'speed_sensing_auto_door_lock', 'boolean'),
    'isofix child seat mounts': norm('safety', 'isofix', 'safety.isofix', 'boolean'),
    'isofix': norm('safety', 'isofix', 'safety.isofix', 'boolean'),
    'heads up display hud': raw('safety', 'hud', 'boolean'),
    'hud': raw('safety', 'hud', 'boolean'),
    'hill descent control': norm('safety', 'hill_descent', 'safety.hill_descent', 'boolean'),
    'hill descent': norm('safety', 'hill_descent', 'safety.hill_descent', 'boolean'),
    'hill assist': norm('safety', 'hill_hold', 'safety.hill_hold', 'boolean'),
    'hill hold': norm('safety', 'hill_hold', 'safety.hill_hold', 'boolean'),
    'impact sensing auto door unlock': raw('safety', 'impact_sensing_auto_door_unlock', 'boolean'),
    '360 view camera': norm('safety', 'camera_360', 'safety.camera_360', 'boolean'),
    '360 degree camera': norm('safety', 'camera_360', 'safety.camera_360', 'boolean'),
    '360 camera': norm('safety', 'camera_360', 'safety.camera_360', 'boolean'),
    // Promoted to typed schema fields. parseSpecValue('5 Star', 'number') → 5,
    // so labels like "5 Star (BNCAP) Rating" become safety.bncap_rating = 5.
    // The original string is preserved alongside in specs_raw via the parser fallback.
    'bharat ncap safety rating': norm('safety', 'bncap_rating', 'safety.bncap_rating', 'number'),
    'bncap safety rating': norm('safety', 'bncap_rating', 'safety.bncap_rating', 'number'),
    'bncap rating': norm('safety', 'bncap_rating', 'safety.bncap_rating', 'number'),
    'bharat ncap rating': norm('safety', 'bncap_rating', 'safety.bncap_rating', 'number'),
    'bharat ncap child safety rating': raw('safety', 'bharat_ncap_child_safety_rating', 'string'),
    'global ncap safety rating': norm('safety', 'global_ncap_rating', 'safety.global_ncap_rating', 'number'),
    'global ncap rating': norm('safety', 'global_ncap_rating', 'safety.global_ncap_rating', 'number'),
    'global ncap adult safety rating': norm('safety', 'global_ncap_rating', 'safety.global_ncap_rating', 'number'),
    // Generic NCAP rating — overwritten in the CarWale-aliases section below to point here too.
    'ncap rating adult': norm('safety', 'ncap_rating', 'safety.ncap_rating', 'number'),
    'adas level': norm('safety', 'adas_level', 'safety.adas_level', 'number'),
    'pretensioners and force limiter seatbelts': raw('safety', 'pretensioners_force_limiter_seatbelts', 'string'),
    'pretensioners force limiter seatbelts': raw('safety', 'pretensioners_force_limiter_seatbelts', 'string'),
    'crash sensor': norm('safety', 'crash_sensor', 'safety.crash_sensor', 'boolean'),
    // ─── ADAS ─────────────────────────────────────────────────────────────────
    'adaptive cruise control': norm('adas', 'adaptive_cruise_control', 'adas.adaptive_cruise_control', 'boolean'),
    'lane keep assist': norm('adas', 'lane_keep_assist', 'adas.lane_keep_assist', 'boolean'),
    'lane departure warning': norm('adas', 'lane_departure_warning', 'adas.lane_departure_warning', 'boolean'),
    'lane departure prevention assist': raw('adas', 'lane_departure_prevention_assist', 'boolean'),
    'blind spot monitor': norm('adas', 'blind_spot_monitoring', 'adas.blind_spot_monitoring', 'boolean'),
    'blind spot monitoring': norm('adas', 'blind_spot_monitoring', 'adas.blind_spot_monitoring', 'boolean'),
    'blind spot collision avoidance assist': norm('adas', 'blind_spot_monitoring', 'adas.blind_spot_monitoring', 'boolean'),
    'forward collision warning': norm('adas', 'forward_collision_warning', 'adas.forward_collision_warning', 'boolean'),
    'automatic emergency braking': norm('adas', 'automatic_emergency_braking', 'adas.automatic_emergency_braking', 'boolean'),
    'autonomous emergency braking': norm('adas', 'autonomous_emergency_braking', 'adas.autonomous_emergency_braking', 'boolean'),
    'traffic sign recognition': norm('adas', 'traffic_sign_recognition', 'adas.traffic_sign_recognition', 'boolean'),
    'speed assist system': raw('adas', 'speed_assist_system', 'boolean'),
    // Promoted to typed schema homes (were specs_raw before Batch 1+2).
    'driver attention warning': norm('adas', 'driver_attention_warning', 'adas.driver_attention_warning', 'boolean'),
    'driver drowsiness detection': norm('adas', 'driver_attention_warning', 'adas.driver_attention_warning', 'boolean'),
    'adaptive high beam assist': norm('adas', 'adaptive_high_beam_assist', 'adas.adaptive_high_beam_assist', 'boolean'),
    'high beam assist': norm('adas', 'adaptive_high_beam_assist', 'adas.adaptive_high_beam_assist', 'boolean'),
    'rear cross traffic alert': norm('adas', 'rear_cross_traffic_alert', 'adas.rear_cross_traffic_alert', 'boolean'),
    'rear cross traffic collision avoidance assist': norm('adas', 'rear_cross_traffic_alert', 'adas.rear_cross_traffic_alert', 'boolean'),
    'safe exit warning': norm('adas', 'safe_exit_warning', 'adas.safe_exit_warning', 'boolean'),
    'safe exit assist': norm('adas', 'safe_exit_warning', 'adas.safe_exit_warning', 'boolean'),
    // ─── COMFORT & CONVENIENCE ────────────────────────────────────────────────
    'power steering': raw('comfort_convenience', 'power_steering', 'boolean'),
    'air conditioner': raw('comfort_convenience', 'air_conditioner', 'boolean'),
    'heater': raw('comfort_convenience', 'heater', 'boolean'),
    'adjustable steering': norm('comfort_convenience', 'steering_adjustment', 'comfort_convenience.steering_adjustment', 'string'),
    'height adjustable driver seat': raw('comfort_convenience', 'height_adjustable_driver_seat', 'boolean'),
    'ventilated seats': norm('comfort_convenience', 'ventilated_seats', 'comfort_convenience.ventilated_seats', 'string'),
    'heated seats': norm('comfort_convenience', 'heated_seats', 'comfort_convenience.heated_seats', 'string'),
    'electric adjustable seats': norm('comfort_convenience', 'electric_adjustable_seats', 'comfort_convenience.electric_adjustable_seats', 'string'),
    'memory seats': norm('comfort_convenience', 'memory_seats', 'comfort_convenience.memory_seats', 'string'),
    'lumbar support': norm('comfort_convenience', 'lumbar_support', 'comfort_convenience.lumbar_support', 'boolean'),
    'automatic climate control': norm('comfort_convenience', 'automatic_climate_control', 'comfort_convenience.automatic_climate_control', 'boolean'),
    'air quality control': norm('comfort_convenience', 'air_quality_control', 'comfort_convenience.air_quality_control', 'boolean'),
    'climate control': norm('comfort_convenience', 'climate_control', 'comfort_convenience.climate_control', 'string'),
    'accessory power outlet': raw('comfort_convenience', 'accessory_power_outlet', 'boolean'),
    'trunk light': raw('comfort_convenience', 'trunk_light', 'boolean'),
    'vanity mirror': raw('comfort_convenience', 'vanity_mirror', 'boolean'),
    'rear reading lamp': raw('comfort_convenience', 'rear_reading_lamp', 'boolean'),
    'rear seat headrest': raw('comfort_convenience', 'rear_seat_headrest', 'string'),
    'adjustable headrest': raw('comfort_convenience', 'adjustable_headrest', 'boolean'),
    'rear seat centre arm rest': raw('comfort_convenience', 'rear_seat_center_armrest', 'string'),
    'rear seat center arm rest': raw('comfort_convenience', 'rear_seat_center_armrest', 'string'),
    'height adjustable front seat belts': raw('comfort_convenience', 'height_adjustable_front_seat_belts', 'boolean'),
    'rear ac vents': norm('comfort_convenience', 'rear_ac_vents', 'comfort_convenience.rear_ac_vents', 'boolean'),
    'cruise control': norm('comfort_convenience', 'cruise_control', 'comfort_convenience.cruise_control', 'boolean'),
    'foldable rear seat': norm('comfort_convenience', 'folding_rear_seats', 'comfort_convenience.folding_rear_seats', 'string'),
    'keyless entry': norm('comfort_convenience', 'keyless_entry', 'comfort_convenience.keyless_entry', 'boolean'),
    'engine start stop button': norm('comfort_convenience', 'push_button_start', 'comfort_convenience.push_button_start', 'boolean'),
    'push button start': norm('comfort_convenience', 'push_button_start', 'comfort_convenience.push_button_start', 'boolean'),
    'cooled glovebox': norm('comfort_convenience', 'cooled_glovebox', 'comfort_convenience.cooled_glovebox', 'boolean'),
    'voice commands': norm('infotainment_connectivity', 'voice_command', 'infotainment_connectivity.voice_command', 'boolean'),
    'voice command': norm('infotainment_connectivity', 'voice_command', 'infotainment_connectivity.voice_command', 'boolean'),
    'paddle shifters': norm('comfort_convenience', 'paddle_shifters', 'comfort_convenience.paddle_shifters', 'boolean'),
    'usb charger': raw('comfort_convenience', 'usb_charger', 'string'),
    'central console armrest': raw('comfort_convenience', 'central_console_armrest', 'string'),
    'tailgate ajar warning': raw('comfort_convenience', 'tailgate_ajar_warning', 'boolean'),
    'hands free tailgate': raw('comfort_convenience', 'hands_free_tailgate', 'boolean'),
    'drive modes': norm('engine_performance', 'drive_modes', 'engine_performance.drive_modes', 'string'),
    'drive mode types': raw('comfort_convenience', 'drive_mode_types', 'string'),
    'rear window sunblind': norm('interior', 'rear_sunblind', 'interior.rear_sunblind', 'boolean'),
    'follow me home headlamps': norm('exterior', 'follow_me_home', 'exterior.follow_me_home', 'boolean'),
    'follow me home': norm('exterior', 'follow_me_home', 'exterior.follow_me_home', 'boolean'),
    'voice assisted sunroof': raw('comfort_convenience', 'voice_assisted_sunroof', 'boolean'),
    'power windows': norm('comfort_convenience', 'power_windows', 'comfort_convenience.power_windows', 'string'),
    'cup holders': raw('comfort_convenience', 'cup_holders', 'string'),
    'remote start': norm('comfort_convenience', 'remote_start', 'comfort_convenience.remote_start', 'boolean'),
    // 'remote engine start' label re-routed to connected_car.remote_engine_start_stop
    // in the CarWale aliases section below (Batch 1+2 — that's the more specific app-side meaning).
    'steering mounted controls': norm('comfort_convenience', 'steering_mounted_controls', 'comfort_convenience.steering_mounted_controls', 'boolean'),
    // ─── INTERIOR ─────────────────────────────────────────────────────────────
    'tachometer': raw('interior', 'tachometer', 'boolean'),
    'leather wrapped steering wheel': norm('interior', 'leather_wrapped_steering', 'interior.leather_wrapped_steering', 'boolean'),
    'leather wrap gear shift selector': norm('interior', 'leather_wrapped_gear_knob', 'interior.leather_wrapped_gear_knob', 'boolean'),
    'leather wrapped gear knob': norm('interior', 'leather_wrapped_gear_knob', 'interior.leather_wrapped_gear_knob', 'boolean'),
    'glove box': raw('interior', 'glove_box', 'boolean'),
    'digital cluster': norm('interior', 'digital_driver_display', 'interior.digital_driver_display', 'boolean'),
    'digital cluster size': raw('interior', 'digital_cluster_size', 'string'),
    'instrument cluster': norm('interior', 'instrument_cluster', 'interior.instrument_cluster', 'string'),
    'ambient lighting': norm('interior', 'ambient_lighting', 'interior.ambient_lighting', 'boolean'),
    'multi color ambient lighting': norm('interior', 'multi_color_ambient_lighting', 'interior.multi_color_ambient_lighting', 'boolean'),
    'dashboard type': norm('interior', 'dashboard_type', 'interior.dashboard_type', 'string'),
    'dashboard material': norm('interior', 'dashboard_material', 'interior.dashboard_material', 'string'),
    'soft touch dashboard': norm('interior', 'soft_touch_dashboard', 'interior.soft_touch_dashboard', 'boolean'),
    'interior theme': norm('interior', 'interior_theme', 'interior.interior_theme', 'string'),
    'interior color': norm('interior', 'interior_color', 'interior.interior_color', 'string'),
    'upholstery': norm('interior', 'interior_material', 'interior.interior_material', 'string'),
    'sunroof': norm('interior', 'sunroof', 'interior.sunroof', 'string'),
    'panoramic sunroof': norm('interior', 'panoramic_sunroof', 'interior.panoramic_sunroof', 'boolean'),
    'moonroof': norm('interior', 'moonroof', 'interior.moonroof', 'boolean'),
    // Batch 1+2 — interior digital cluster atoms (typed homes added 2026-05-17).
    'premium cabin materials': norm('interior', 'premium_cabin_materials', 'interior.premium_cabin_materials', 'boolean'),
    'premium materials': norm('interior', 'premium_cabin_materials', 'interior.premium_cabin_materials', 'boolean'),
    'steering controls': norm('interior', 'steering_controls', 'interior.steering_controls', 'boolean'),
    // ─── EXTERIOR ─────────────────────────────────────────────────────────────
    // Promoted to typed schema home (Batch 1+2).
    'rain sensing wiper': norm('exterior', 'rain_sensing_wipers', 'exterior.rain_sensing_wipers', 'boolean'),
    'rear window wiper': norm('comfort_convenience', 'rear_wiper', 'comfort_convenience.rear_wiper', 'boolean'),
    'rear wiper': norm('comfort_convenience', 'rear_wiper', 'comfort_convenience.rear_wiper', 'boolean'),
    'rear window washer': raw('exterior', 'rear_window_washer', 'boolean'),
    'rear window defogger': norm('comfort_convenience', 'rear_window_defogger', 'comfort_convenience.rear_window_defogger', 'boolean'),
    'rear defogger': norm('comfort_convenience', 'rear_window_defogger', 'comfort_convenience.rear_window_defogger', 'boolean'),
    'rear spoiler': norm('exterior', 'spoiler', 'exterior.spoiler', 'boolean'),
    'spoiler': norm('exterior', 'spoiler', 'exterior.spoiler', 'boolean'),
    'outside rear view mirror turn indicators': norm('exterior', 'orvm_indicators', 'exterior.orvm_indicators', 'boolean'),
    'orvm turn indicators': norm('exterior', 'orvm_indicators', 'exterior.orvm_indicators', 'boolean'),
    'outside rear view mirror orvm': raw('exterior', 'orvm', 'string'),
    'orvm': raw('exterior', 'orvm', 'string'),
    'integrated antenna': raw('exterior', 'integrated_antenna', 'boolean'),
    'antenna': raw('exterior', 'antenna', 'string'),
    'projector headlamps': raw('exterior', 'projector_headlamps', 'boolean'),
    'cornering foglamps': raw('exterior', 'cornering_foglamps', 'boolean'),
    'roof rails': norm('exterior', 'roof_rails', 'exterior.roof_rails', 'boolean'),
    'automatic headlamps': norm('exterior', 'automatic_headlamps', 'exterior.automatic_headlamps', 'boolean'),
    'fog lights': norm('exterior', 'fog_lights', 'exterior.fog_lights', 'string'),
    'fog lamps': norm('exterior', 'fog_lights', 'exterior.fog_lights', 'string'),
    'puddle lamps': raw('exterior', 'puddle_lamps', 'boolean'),
    'boot opening': raw('exterior', 'boot_opening', 'string'),
    'led drls': norm('exterior', 'drl', 'exterior.drl', 'boolean'),
    'led drl': norm('exterior', 'drl', 'exterior.drl', 'boolean'),
    'drl': norm('exterior', 'drl', 'exterior.drl', 'boolean'),
    'led headlamps': norm('exterior', 'led_headlights', 'exterior.led_headlights', 'boolean'),
    'led headlights': norm('exterior', 'led_headlights', 'exterior.led_headlights', 'boolean'),
    'led taillights': norm('exterior', 'led_tail_lights', 'exterior.led_tail_lights', 'boolean'),
    'led tail lights': norm('exterior', 'led_tail_lights', 'exterior.led_tail_lights', 'boolean'),
    'led fog lamps': raw('exterior', 'led_fog_lamps', 'boolean'),
    'headlight type': norm('exterior', 'headlight_type', 'exterior.headlight_type', 'string'),
    'headlamp washer': norm('comfort_convenience', 'headlamp_washer', 'comfort_convenience.headlamp_washer', 'boolean'),
    'body color': norm('exterior', 'body_color', 'exterior.body_color', 'string'),
    'skid plate': norm('exterior', 'skid_plate', 'exterior.skid_plate', 'boolean'),
    'alloy wheels design': norm('exterior', 'alloy_wheels_design', 'exterior.alloy_wheels_design', 'string'),
    // ─── ENTERTAINMENT & COMMUNICATION ────────────────────────────────────────
    'radio': raw('infotainment_connectivity', 'radio', 'boolean'),
    'wireless phone charging': norm('infotainment_connectivity', 'wireless_charging', 'infotainment_connectivity.wireless_charging', 'boolean'),
    'wireless charger': norm('infotainment_connectivity', 'wireless_charging', 'infotainment_connectivity.wireless_charging', 'boolean'),
    'wireless charging': norm('infotainment_connectivity', 'wireless_charging', 'infotainment_connectivity.wireless_charging', 'boolean'),
    'bluetooth connectivity': norm('infotainment_connectivity', 'bluetooth', 'infotainment_connectivity.bluetooth', 'boolean'),
    'bluetooth': norm('infotainment_connectivity', 'bluetooth', 'infotainment_connectivity.bluetooth', 'boolean'),
    'touchscreen': norm('infotainment_connectivity', 'touchscreen', 'infotainment_connectivity.touchscreen', 'string'),
    'touchscreen size': norm('infotainment_connectivity', 'touchscreen', 'infotainment_connectivity.touchscreen', 'string'),
    'android auto': norm('infotainment_connectivity', 'android_auto', 'infotainment_connectivity.android_auto', 'boolean'),
    'apple carplay': norm('infotainment_connectivity', 'apple_carplay', 'infotainment_connectivity.apple_carplay', 'boolean'),
    'usb ports': raw('infotainment_connectivity', 'usb_ports_present', 'boolean'),
    'no of speakers': norm('infotainment_connectivity', 'speakers', 'infotainment_connectivity.speakers', 'number'),
    'number of speakers': norm('infotainment_connectivity', 'speakers', 'infotainment_connectivity.speakers', 'number'),
    'speakers': raw('infotainment_connectivity', 'speakers_position', 'string'),
    'wifi hotspot': norm('infotainment_connectivity', 'wifi_hotspot', 'infotainment_connectivity.wifi_hotspot', 'boolean'),
    'internet connectivity': norm('infotainment_connectivity', 'internet_connectivity', 'infotainment_connectivity.internet_connectivity', 'boolean'),
    'ota updates': norm('infotainment_connectivity', 'ota_updates', 'infotainment_connectivity.ota_updates', 'boolean'),
    // ─── ADVANCED INTERNET / CONNECTED CAR ────────────────────────────────────
    'navigation with live traffic': norm('infotainment_connectivity', 'navigation', 'infotainment_connectivity.navigation', 'boolean'),
    'navigation system': norm('infotainment_connectivity', 'navigation', 'infotainment_connectivity.navigation', 'boolean'),
    'navigation': norm('infotainment_connectivity', 'navigation', 'infotainment_connectivity.navigation', 'boolean'),
    'e call and i call': raw('connected_car', 'ecall_icall', 'boolean'),
    'ecall icall': raw('connected_car', 'ecall_icall', 'boolean'),
    'google and alexa connectivity': raw('connected_car', 'google_alexa_connectivity', 'boolean'),
    'google alexa connectivity': raw('connected_car', 'google_alexa_connectivity', 'boolean'),
    'sos button': norm('connected_car', 'sos_emergency_assist', 'connected_car.sos_emergency_assist', 'boolean'),
    'sos emergency assist': norm('connected_car', 'sos_emergency_assist', 'connected_car.sos_emergency_assist', 'boolean'),
    'app connectivity': norm('connected_car', 'app_connectivity', 'connected_car.app_connectivity', 'boolean'),
    'vehicle tracking': norm('connected_car', 'vehicle_tracking', 'connected_car.vehicle_tracking', 'boolean'),
    'geofencing': norm('connected_car', 'geofencing', 'connected_car.geofencing', 'boolean'),
    'remote vehicle control': norm('connected_car', 'remote_vehicle_control', 'connected_car.remote_vehicle_control', 'boolean'),
    'connected car tech': norm('connected_car', 'connected_car_tech', 'connected_car.connected_car_tech', 'string'),
    // ─── WARRANTY ─────────────────────────────────────────────────────────────
    'basic warranty years': norm('warranty', 'basic_warranty_years', 'warranty.basic_warranty_years', 'number'),
    'basic warranty km': norm('warranty', 'basic_warranty_km', 'warranty.basic_warranty_km', 'number'),
    'battery warranty years': norm('warranty', 'battery_warranty_years', 'warranty.battery_warranty_years', 'number'),
    'battery warranty km': norm('warranty', 'battery_warranty_km', 'warranty.battery_warranty_km', 'number'),
    // ─── SPECIAL: ADDITIONAL FEATURES (accumulator) ───────────────────────────
    'additional features': {
        category: 'features',
        key: 'additional_features',
        path: 'specs_raw.additional_features',
        type: 'array',
    },
    // ══════════════════════════════════════════════════════════════════════════
    // CARWALE ALIASES — CarWale uses different label vocabulary from CarDekho.
    // Covers all labels found across 7 diverse car types (petrol/diesel/EV/CNG,
    // hatchback/sedan/SUV/flagship). Keys = normalizeLabel() output.
    // The CarWaleExtractor pre-processes compound patterns (N Airbags, -No suffix,
    // Android Auto+CarPlay, N Speakers, N-inch screen, Bootspace-NL) before
    // labels reach this map.
    // ══════════════════════════════════════════════════════════════════════════
    // ─── Engine & performance ─────────────────────────────────────────────────
    'mileage': norm('mileage_range', 'arai_mileage', 'mileage_range.arai_mileage', 'string'),
    'arai': norm('mileage_range', 'arai_mileage', 'mileage_range.arai_mileage', 'string'),
    'ethanol compatibility': norm('mileage_range', 'ethanol_compatibility', 'mileage_range.ethanol_compatibility', 'string'),
    'emission standard': norm('mileage_range', 'emission_standard', 'mileage_range.emission_standard', 'string'),
    'engine': raw('engine_performance', 'engine_description', 'string'),
    'max power bhp rpm': norm('engine_performance', 'max_power', 'engine_performance.max_power', 'string'),
    'max torque nm rpm': norm('engine_performance', 'max_torque', 'engine_performance.max_torque', 'string'),
    'turbocharger supercharger': norm('engine_performance', 'turbocharger', 'engine_performance.turbocharger', 'boolean'),
    'fuel change over switch': raw('engine_performance', 'fuel_change_over_switch', 'boolean'),
    'direct start in cng': raw('engine_performance', 'direct_start_cng', 'boolean'),
    // Promoted to typed schema home (Batch 1+2).
    'terrain modes': norm('engine_performance', 'terrain_modes', 'engine_performance.terrain_modes', 'string'),
    'terrain response': norm('engine_performance', 'terrain_modes', 'engine_performance.terrain_modes', 'string'),
    'off road modes': norm('engine_performance', 'terrain_modes', 'engine_performance.terrain_modes', 'string'),
    'chassis type': raw('dimensions_practicality', 'chassis_type', 'string'),
    'clutch type': raw('engine_performance', 'clutch_type', 'string'),
    'acceleration': norm('engine_performance', 'acceleration_0_100', 'engine_performance.acceleration_0_100', 'string'),
    // ─── Battery & range (EV specific) ───────────────────────────────────────
    'driving range': norm('battery_charging', 'electric_range', 'battery_charging.electric_range', 'string'),
    'pure electric driving mode': raw('battery_charging', 'pure_electric_mode', 'boolean'),
    'officially certified range km': norm('battery_charging', 'electric_range', 'battery_charging.electric_range', 'string'),
    'ac regular charging': raw('battery_charging', 'charging_time_ac', 'string'),
    'dc fast charging': raw('battery_charging', 'charging_time_dc', 'string'),
    'ac fast charging': raw('battery_charging', 'charging_time_ac_fast', 'string'),
    'charger connection type': raw('battery_charging', 'charger_connection_type', 'string'),
    // Promoted to typed schema homes (Batch 1+2).
    'vehicle to vehicle charging v2v': norm('battery_charging', 'vehicle_to_vehicle', 'battery_charging.vehicle_to_vehicle', 'boolean'),
    'vehicle to vehicle': norm('battery_charging', 'vehicle_to_vehicle', 'battery_charging.vehicle_to_vehicle', 'boolean'),
    'v2v charging': norm('battery_charging', 'vehicle_to_vehicle', 'battery_charging.vehicle_to_vehicle', 'boolean'),
    'vehicle to load technology v2l': norm('battery_charging', 'vehicle_to_load', 'battery_charging.vehicle_to_load', 'boolean'),
    'vehicle to load': norm('battery_charging', 'vehicle_to_load', 'battery_charging.vehicle_to_load', 'boolean'),
    'v2l technology': norm('battery_charging', 'vehicle_to_load', 'battery_charging.vehicle_to_load', 'boolean'),
    'v2l charging': norm('battery_charging', 'vehicle_to_load', 'battery_charging.vehicle_to_load', 'boolean'),
    'ingress protection ip for motor and battery pack': raw('battery_charging', 'ip_rating', 'string'),
    'portable ev charging cable': raw('battery_charging', 'portable_charging_cable', 'boolean'),
    'charging indicator on light bar': raw('battery_charging', 'charging_indicator', 'boolean'),
    // Battery Performance section (EV)
    'battery': norm('battery_charging', 'battery_capacity', 'battery_charging.battery_capacity', 'string'),
    'electric motor': raw('battery_charging', 'motor_type', 'string'),
    'power transfer type': raw('battery_charging', 'power_transfer_type', 'string'),
    // ─── Transmission & drivetrain ────────────────────────────────────────────
    'transmission': { category: 'engine_performance', key: 'transmission_type', rootKey: 'transmission_type', type: 'transmission' },
    'drivetrain': { category: 'engine_performance', key: 'drivetrain', rootKey: 'drivetrain', type: 'string' },
    'differential lock': raw('engine_performance', 'differential_lock', 'boolean'),
    'four wheel drive': raw('engine_performance', 'four_wheel_drive', 'boolean'),
    // ─── Suspension ───────────────────────────────────────────────────────────
    'advanced suspension features': raw('suspension_steering_brakes', 'advanced_suspension', 'boolean'),
    'frequency selective damping fsd': raw('suspension_steering_brakes', 'frequency_selective_damping', 'boolean'),
    // ─── Dimensions ───────────────────────────────────────────────────────────
    'length width height': raw('dimensions_practicality', 'dimensions', 'string'),
    'doors': norm('dimensions_practicality', 'doors', 'dimensions_practicality.doors', 'number'),
    'minimum turning radius': raw('suspension_steering_brakes', 'turning_radius', 'string'),
    'kerb weight range': norm('dimensions_practicality', 'kerb_weight', 'dimensions_practicality.kerb_weight', 'string'),
    // ─── Tyres & wheels ───────────────────────────────────────────────────────
    'wheels': raw('tyres_wheels', 'wheel_type', 'string'),
    'front tyres': raw('tyres_wheels', 'front_tyre_size', 'string'),
    'rear tyres': raw('tyres_wheels', 'rear_tyre_size', 'string'),
    'spare wheel and tyre': norm('tyres_wheels', 'spare_tyre', 'tyres_wheels.spare_tyre', 'string'),
    'tyres': norm('tyres_wheels', 'tyre_type', 'tyres_wheels.tyre_type', 'string'),
    // ─── ADAS ─────────────────────────────────────────────────────────────────
    'lane functions': norm('adas', 'lane_keep_assist', 'adas.lane_keep_assist', 'boolean'),
    'automatic emergency braking aeb': norm('adas', 'automatic_emergency_braking', 'adas.automatic_emergency_braking', 'boolean'),
    'blind spot detection': norm('adas', 'blind_spot_monitoring', 'adas.blind_spot_monitoring', 'boolean'),
    // 'high beam assist' was promoted to typed adas.adaptive_high_beam_assist
    // in the main ADAS section above (deduped here to avoid object-literal collision).
    'emergency brake light flashing': raw('safety', 'emergency_brake_light_flashing', 'boolean'),
    'traffic sign recognition tsr': norm('adas', 'traffic_sign_recognition', 'adas.traffic_sign_recognition', 'boolean'),
    'rear collision assist': raw('adas', 'rear_collision_assist', 'boolean'),
    'safe exit warning sew': norm('adas', 'safe_exit_warning', 'adas.safe_exit_warning', 'boolean'),
    'leading vehicle departure alert lvda': raw('adas', 'leading_vehicle_departure_alert', 'boolean'),
    'cornering brake control cbc': raw('safety', 'cornering_brake_control', 'boolean'),
    'brake sway control': raw('safety', 'brake_sway_control', 'boolean'),
    'automatic park lock': raw('safety', 'automatic_park_lock', 'boolean'),
    'clutch lock': raw('safety', 'clutch_lock', 'boolean'),
    'video recording': raw('safety', 'video_recording', 'boolean'),
    'adas': raw('adas', 'adas_system', 'boolean'),
    'acoustic vehicle alerting system avas': raw('safety', 'avas', 'boolean'),
    'thermal incident protection': raw('safety', 'thermal_incident_protection', 'boolean'),
    // ─── Passive safety ───────────────────────────────────────────────────────
    // "N Airbags" labels pre-processed in CarWaleExtractor → label="Airbags", value=N
    'airbags': norm('safety', 'airbags', 'safety.airbags', 'number'),
    // Promoted: parseSpecValue('5 Star', 'number') returns 5. "Not Tested" → null.
    'ncap rating': norm('safety', 'ncap_rating', 'safety.ncap_rating', 'number'),
    'ncap rating not tested': norm('safety', 'ncap_rating', 'safety.ncap_rating', 'number'),
    'ncap rating 1 star ancap rating': norm('safety', 'ncap_rating', 'safety.ncap_rating', 'number'),
    // "N Star (X NCAP) Rating" pre-processed in CarWaleExtractor → label="NCAP Rating", value="N Star"
    'rear middle three point seatbelt': raw('safety', 'rear_middle_seatbelt', 'boolean'),
    'child seat anchor points': norm('safety', 'isofix', 'safety.isofix', 'boolean'),
    'engine immobiliser': norm('safety', 'engine_immobilizer', 'safety.engine_immobilizer', 'boolean'),
    'puncture repair kit': raw('safety', 'puncture_repair_kit', 'boolean'),
    'dashcam': raw('safety', 'dashcam', 'boolean'),
    'passenger airbag deactivation switch': raw('safety', 'passenger_airbag_deactivation', 'boolean'),
    'collapsible steering column': raw('safety', 'collapsible_steering_column', 'boolean'),
    'tyre inflator': raw('safety', 'tyre_inflator', 'boolean'),
    'pretensioning seatbelts with load limiter all': raw('safety', 'pretensioner_seatbelts', 'boolean'),
    'pretensioning seatbelts front': raw('safety', 'pretensioner_seatbelts', 'boolean'),
    'breakdown assistance call button': raw('safety', 'breakdown_assistance', 'boolean'),
    'rear middle head rest': raw('safety', 'rear_middle_headrest', 'boolean'),
    'third row middle seat safety': raw('safety', 'third_row_safety', 'boolean'),
    'airbag configuration': raw('safety', 'airbag_config', 'string'),
    // ─── Brakes ───────────────────────────────────────────────────────────────
    'brake type': raw('suspension_steering_brakes', 'brake_type', 'string'),
    'disc brake front drum brake rear': raw('suspension_steering_brakes', 'brake_type', 'string'),
    'ventilated disc brake front drum brake rear': raw('suspension_steering_brakes', 'brake_type', 'string'),
    'disc brake front and rear': raw('suspension_steering_brakes', 'brake_type', 'string'),
    'ventilated disc brake front and rear': raw('suspension_steering_brakes', 'brake_type', 'string'),
    'disc front drum rear': raw('suspension_steering_brakes', 'brake_type', 'string'),
    'brake assist ba': norm('safety', 'brake_assist', 'safety.brake_assist', 'boolean'),
    'electronic brake force distribution ebd': norm('safety', 'ebd', 'safety.ebd', 'boolean'),
    'electronic stability program esp': norm('safety', 'esp', 'safety.esp', 'boolean'),
    'traction control system tc tcs': norm('safety', 'traction_control', 'safety.traction_control', 'boolean'),
    'hill hold control': norm('safety', 'hill_hold', 'safety.hill_hold', 'boolean'),
    'brake disc wiping bdw': raw('safety', 'brake_disc_wiping', 'boolean'),
    'brake disc wiping': raw('safety', 'brake_disc_wiping', 'boolean'),
    'motor slip regulation msr': raw('safety', 'motor_slip_regulation', 'boolean'),
    'multi collision brake': raw('safety', 'multi_collision_brake', 'boolean'),
    'brake override system': raw('safety', 'brake_override_system', 'boolean'),
    // ─── AC & climate control ─────────────────────────────────────────────────
    'air purifier': norm('comfort_convenience', 'air_quality_control', 'comfort_convenience.air_quality_control', 'boolean'),
    'optional air purifier': raw('comfort_convenience', 'optional_air_purifier', 'boolean'),
    // ─── Doors, mirrors & wipers ──────────────────────────────────────────────
    'keyless central locking': norm('safety', 'central_locking', 'safety.central_locking', 'boolean'),
    'manual key operated central locking': norm('safety', 'central_locking', 'safety.central_locking', 'boolean'),
    'speed sensing door lock': raw('safety', 'speed_sensing_auto_door_lock', 'boolean'),
    'rain sensing wipers': norm('exterior', 'rain_sensing_wipers', 'exterior.rain_sensing_wipers', 'boolean'),
    'electrically adjustable orvms': raw('exterior', 'electrically_adjustable_orvms', 'boolean'),
    'auto folding adjustable orvms': raw('exterior', 'auto_folding_orvms', 'boolean'),
    'memory orvms': raw('exterior', 'memory_orvms', 'boolean'),
    'heated orvm': raw('exterior', 'heated_orvm', 'boolean'),
    'electric boot tailgate release': raw('comfort_convenience', 'electric_boot_release', 'boolean'),
    'capless fuel fillers lid': raw('exterior', 'capless_fuel_lid', 'boolean'),
    // ─── Sunroof & windows ────────────────────────────────────────────────────
    'remote sunroof open close via app': norm('connected_car', 'remote_sunroof', 'connected_car.remote_sunroof', 'boolean'),
    'voice controlled panoramic sunroof': norm('interior', 'panoramic_sunroof', 'interior.panoramic_sunroof', 'boolean'),
    'electrically adjustable sunroof': norm('interior', 'sunroof', 'interior.sunroof', 'string'),
    'window sunshade': raw('interior', 'window_sunshade', 'boolean'),
    // ─── Driver assistance ────────────────────────────────────────────────────
    'keyless start button start': norm('comfort_convenience', 'push_button_start', 'comfort_convenience.push_button_start', 'boolean'),
    'electronic parking brake': raw('suspension_steering_brakes', 'electronic_parking_brake', 'boolean'),
    'parking sensors in rear': norm('safety', 'parking_sensors', 'safety.parking_sensors', 'string'),
    'parking assist': raw('safety', 'parking_assist', 'boolean'),
    'park distance control': raw('safety', 'parking_assist', 'boolean'),
    'driver rear view monitor drvm': norm('safety', 'rear_camera', 'safety.rear_camera', 'boolean'),
    'parking assist with reverse camera': norm('safety', 'rear_camera', 'safety.rear_camera', 'boolean'),
    'creep function': raw('comfort_convenience', 'creep_function', 'boolean'),
    'remote parking with key': raw('safety', 'remote_parking', 'boolean'),
    // ─── Infotainment & entertainment ─────────────────────────────────────────
    // Android Auto / CarPlay combos are split in CarWaleExtractor
    'android auto and apple carplay': norm('infotainment_connectivity', 'android_auto', 'infotainment_connectivity.android_auto', 'boolean'),
    'gps navigation system': norm('infotainment_connectivity', 'navigation', 'infotainment_connectivity.navigation', 'boolean'),
    // Bluetooth compound labels normalized in CarWaleExtractor → "Bluetooth Compatibility"
    'bluetooth compatibility': norm('infotainment_connectivity', 'bluetooth', 'infotainment_connectivity.bluetooth', 'boolean'),
    'over the air ota updates': norm('infotainment_connectivity', 'ota_updates', 'infotainment_connectivity.ota_updates', 'boolean'),
    'infotainment screen': raw('infotainment_connectivity', 'infotainment_screen', 'boolean'),
    // "N Speakers" pre-processed in CarWaleExtractor → label="Speakers", value=N
    // ('speakers' → infotainment_connectivity.speakers already exists above)
    // "N-inch Touch-screen Display" pre-processed → "Touchscreen"
    // ('touchscreen' already exists above)
    'voice assistant': norm('infotainment_connectivity', 'voice_command', 'infotainment_connectivity.voice_command', 'boolean'),
    'voice assistant via smartphone': norm('infotainment_connectivity', 'voice_command', 'infotainment_connectivity.voice_command', 'boolean'),
    'voice assistant via google assistant': norm('infotainment_connectivity', 'voice_command', 'infotainment_connectivity.voice_command', 'boolean'),
    'voice assistant via alexa': norm('infotainment_connectivity', 'voice_command', 'infotainment_connectivity.voice_command', 'boolean'),
    // ─── Instrument cluster ───────────────────────────────────────────────────
    'fuel consumption': raw('mileage_range', 'fuel_consumption_info', 'string'),
    'analogue instrument cluster': raw('interior', 'instrument_cluster_type', 'string'),
    'analogue tachometer': raw('interior', 'tachometer_type', 'string'),
    // Promoted to the new driver_display_controls sub-section (Batch 1+2).
    'gear indicator': norm('driver_display_controls', 'gear_indicator', 'driver_display_controls.gear_indicator', 'boolean'),
    'shift indicator': norm('driver_display_controls', 'gear_indicator', 'driver_display_controls.gear_indicator', 'boolean'),
    'gear shift indicator': norm('driver_display_controls', 'gear_indicator', 'driver_display_controls.gear_indicator', 'boolean'),
    'dynamic shift indicator': norm('driver_display_controls', 'gear_indicator', 'driver_display_controls.gear_indicator', 'boolean'),
    'trip meter with 2 trips electronic': raw('interior', 'trip_meter', 'boolean'),
    // Promoted to typed schema homes (Batch 1+2 added typed interior digital atoms).
    'digital clock': norm('interior', 'digital_clock', 'interior.digital_clock', 'boolean'),
    'average speed': raw('interior', 'average_speed_display', 'boolean'),
    'navigation on instrument cluster': raw('interior', 'navigation_on_cluster', 'boolean'),
    'tyre position display': raw('safety', 'tyre_position_display', 'boolean'),
    'outside temperature gauge': raw('interior', 'outside_temp_gauge', 'boolean'),
    'low battery warning': raw('safety', 'low_battery_warning', 'boolean'),
    'cng fuel gauge': raw('interior', 'cng_fuel_gauge', 'boolean'),
    'digital speedometer': norm('interior', 'digital_speedometer', 'interior.digital_speedometer', 'boolean'),
    'digital tachometer': norm('interior', 'digital_tachometer', 'interior.digital_tachometer', 'boolean'),
    // ─── Steering ─────────────────────────────────────────────────────────────
    'power assisted electric steering': norm('suspension_steering_brakes', 'steering_type', 'suspension_steering_brakes.steering_type', 'string'),
    'power assisted steering': norm('suspension_steering_brakes', 'steering_type', 'suspension_steering_brakes.steering_type', 'string'),
    'tilt steering adjustment': raw('suspension_steering_brakes', 'tilt_steering', 'boolean'),
    'tilt and telescopic steering adjustment': raw('suspension_steering_brakes', 'tilt_telescopic_steering', 'boolean'),
    'additional steering features': raw('suspension_steering_brakes', 'additional_steering_features', 'boolean'),
    // ─── Lighting ─────────────────────────────────────────────────────────────
    'halogen projector headlights': raw('exterior', 'projector_headlamps', 'boolean'),
    'led projector headlights': norm('exterior', 'led_headlights', 'exterior.led_headlights', 'boolean'),
    'halogen headlights': raw('exterior', 'headlight_type', 'string'),
    'halogen taillights': raw('exterior', 'taillight_type', 'string'),
    'cornering headlights': raw('exterior', 'cornering_headlights', 'boolean'),
    'headlight height adjuster': raw('exterior', 'headlight_height_adjuster', 'boolean'),
    'daytime running lights': norm('exterior', 'drl', 'exterior.drl', 'boolean'),
    'led daytime running lights': norm('exterior', 'drl', 'exterior.drl', 'boolean'),
    'ambient interior lighting': norm('interior', 'ambient_lighting', 'interior.ambient_lighting', 'boolean'),
    'sequential turn indicators': raw('exterior', 'sequential_turn_indicators', 'boolean'),
    // Promoted to typed schema home (Batch 1+2).
    'welcome and goodbye animation': norm('exterior', 'welcome_goodbye_animation', 'exterior.welcome_goodbye_animation', 'boolean'),
    'welcome goodbye animation': norm('exterior', 'welcome_goodbye_animation', 'exterior.welcome_goodbye_animation', 'boolean'),
    'illuminated logo': raw('exterior', 'illuminated_logo', 'boolean'),
    'flush door handles': norm('exterior', 'flush_door_handles', 'exterior.flush_door_handles', 'boolean'),
    'flush fitting door handles': norm('exterior', 'flush_door_handles', 'exterior.flush_door_handles', 'boolean'),
    'retractable door handles': norm('exterior', 'flush_door_handles', 'exterior.flush_door_handles', 'boolean'),
    // ─── Mobile app & connected car ───────────────────────────────────────────
    // Promoted to typed schema home — find_my_car is its own field in the schema,
    // distinct from vehicle_tracking. (Previously routed to vehicle_tracking; semantic mismatch.)
    'find my car': norm('connected_car', 'find_my_car', 'connected_car.find_my_car', 'boolean'),
    'geo fence': norm('connected_car', 'geofencing', 'connected_car.geofencing', 'boolean'),
    'remote car lock unlock via app': norm('connected_car', 'remote_lock', 'connected_car.remote_lock', 'boolean'),
    'remote door lock unlock': norm('connected_car', 'remote_lock', 'connected_car.remote_lock', 'boolean'),
    // Promoted to typed schema homes (Batch 1+2 added typed connected_car atoms).
    'remote ac on off via app': norm('connected_car', 'remote_ac', 'connected_car.remote_ac', 'boolean'),
    'remote ac on off': norm('connected_car', 'remote_ac', 'connected_car.remote_ac', 'boolean'),
    'remote ac': norm('connected_car', 'remote_ac', 'connected_car.remote_ac', 'boolean'),
    'remote sunroof': norm('connected_car', 'remote_sunroof', 'connected_car.remote_sunroof', 'boolean'),
    // Connected-car remote_engine_start_stop is distinct from the comfort-side remote_start
    // (the latter is a physical key-fob feature; the former is an app feature).
    'remote engine start stop': norm('connected_car', 'remote_engine_start_stop', 'connected_car.remote_engine_start_stop', 'boolean'),
    'remote engine start': norm('connected_car', 'remote_engine_start_stop', 'connected_car.remote_engine_start_stop', 'boolean'),
    'alexa compatibility': raw('connected_car', 'alexa_compatibility', 'boolean'),
    'car light flashing and honking via app': raw('connected_car', 'remote_horn_lights', 'boolean'),
    'emergency call button': norm('connected_car', 'sos_emergency_assist', 'connected_car.sos_emergency_assist', 'boolean'),
    'emergency sos button': norm('connected_car', 'emergency_sos_button', 'connected_car.emergency_sos_button', 'boolean'),
    'physical sos button': norm('connected_car', 'emergency_sos_button', 'connected_car.emergency_sos_button', 'boolean'),
    'check vehicle status via app': norm('connected_car', 'app_connectivity', 'connected_car.app_connectivity', 'boolean'),
    'vehicle tracking via app': norm('connected_car', 'vehicle_tracking', 'connected_car.vehicle_tracking', 'boolean'),
    'connected car app': norm('connected_car', 'app_connectivity', 'connected_car.app_connectivity', 'boolean'),
    // Promoted to typed schema home (Batch 1+2).
    'live location sharing': norm('connected_car', 'live_location', 'connected_car.live_location', 'boolean'),
    'live location': norm('connected_car', 'live_location', 'connected_car.live_location', 'boolean'),
    'anti theft immobilisation': norm('safety', 'engine_immobilizer', 'safety.engine_immobilizer', 'boolean'),
    'service reminder via app': raw('connected_car', 'service_reminder', 'boolean'),
    'home to car connectivity': raw('connected_car', 'home_car_connectivity', 'boolean'),
    'in car remote': raw('connected_car', 'in_car_remote', 'boolean'),
    'digital key': norm('connected_car', 'digital_key', 'connected_car.digital_key', 'boolean'),
    'nfc digital key': norm('connected_car', 'digital_key', 'connected_car.digital_key', 'boolean'),
    'phone as key': norm('connected_car', 'digital_key', 'connected_car.digital_key', 'boolean'),
    'driving analytics': raw('connected_car', 'driving_analytics', 'boolean'),
    'summon mode': raw('connected_car', 'summon_mode', 'boolean'),
    // ─── Exterior / design & styling ──────────────────────────────────────────
    'body coloured bumpers': raw('exterior', 'body_coloured_bumpers', 'boolean'),
    'rub strips': raw('exterior', 'rub_strips', 'boolean'),
    'scuff plates': raw('exterior', 'scuff_plates', 'boolean'),
    'body kit': raw('exterior', 'body_kit', 'boolean'),
    'front and rear skid plate': norm('exterior', 'skid_plate', 'exterior.skid_plate', 'boolean'),
    'front skid plate': norm('exterior', 'skid_plate', 'exterior.skid_plate', 'boolean'),
    'chrome finish exhaust': raw('exterior', 'chrome_exhaust', 'boolean'),
    'diffuser': raw('exterior', 'diffuser', 'boolean'),
    'ev specific grille': raw('exterior', 'ev_grille', 'boolean'),
    // ─── Interior & seating ───────────────────────────────────────────────────
    'fabric seat upholstery': raw('interior', 'seat_upholstery', 'string'),
    'leather seat upholstery': raw('interior', 'seat_upholstery', 'string'),
    'leatherette seat upholstery': raw('interior', 'seat_upholstery', 'string'),
    'front headrests': raw('interior', 'front_headrests', 'boolean'),
    'front and rear headrests': raw('interior', 'front_rear_headrests', 'boolean'),
    '60 40 split rear seat': raw('comfort_convenience', 'split_rear_seat', 'string'),
    'split rear seat': raw('comfort_convenience', 'split_rear_seat', 'string'),
    'flat folding rear seat': norm('comfort_convenience', 'folding_rear_seats', 'comfort_convenience.folding_rear_seats', 'string'),
    'folding rear seat': norm('comfort_convenience', 'folding_rear_seats', 'comfort_convenience.folding_rear_seats', 'string'),
    'bench seat type for rear passenger': raw('interior', 'rear_seat_type', 'string'),
    'bench seat type for third row': raw('interior', 'third_row_seat_type', 'string'),
    'split third row seat': raw('interior', 'third_row_seat_type', 'string'),
    'cup holder in rear armrest': raw('comfort_convenience', 'rear_cup_holder', 'boolean'),
    'driver armrest': raw('interior', 'driver_armrest', 'boolean'),
    // Promoted to the new storage_cabin_practicality sub-section (Batch 1+2).
    'rear armrest': norm('storage_cabin_practicality', 'rear_armrest', 'storage_cabin_practicality.rear_armrest', 'boolean'),
    'dead pedal for foot rest': raw('interior', 'dead_pedal', 'boolean'),
    'height adjustable seat belt': raw('safety', 'height_adjustable_seatbelt', 'boolean'),
    'massage seats': raw('comfort_convenience', 'massage_seats', 'boolean'),
    'comfort headrest': raw('interior', 'comfort_headrest', 'boolean'),
    // ─── Storage ──────────────────────────────────────────────────────────────
    // "Bootspace -N L" pre-processed in CarWaleExtractor → "Boot Space", value="N L"
    // ('boot space' already exists above)
    // Promoted to the new storage_cabin_practicality sub-section (Batch 1+2).
    'cabin boot access': norm('storage_cabin_practicality', 'cabin_boot_access', 'storage_cabin_practicality.cabin_boot_access', 'boolean'),
    'cabin to boot pass through': norm('storage_cabin_practicality', 'cabin_boot_access', 'storage_cabin_practicality.cabin_boot_access', 'boolean'),
    'cupholders in front only': raw('comfort_convenience', 'cup_holders', 'string'),
    'front and rear door pockets': norm('storage_cabin_practicality', 'door_pockets', 'storage_cabin_practicality.door_pockets', 'boolean'),
    'door pockets': norm('storage_cabin_practicality', 'door_pockets', 'storage_cabin_practicality.door_pockets', 'boolean'),
    'bottle holder in all doors': norm('storage_cabin_practicality', 'door_pockets', 'storage_cabin_practicality.door_pockets', 'boolean'),
    'front seatback pockets': norm('storage_cabin_practicality', 'front_seatback_pockets', 'storage_cabin_practicality.front_seatback_pockets', 'boolean'),
    'seatback pockets': norm('storage_cabin_practicality', 'front_seatback_pockets', 'storage_cabin_practicality.front_seatback_pockets', 'boolean'),
    'driver armrest storage': norm('storage_cabin_practicality', 'driver_armrest_storage', 'storage_cabin_practicality.driver_armrest_storage', 'boolean'),
    'sunglass holder': norm('storage_cabin_practicality', 'sunglass_holder', 'storage_cabin_practicality.sunglass_holder', 'boolean'),
    // New Batch 1+2 storage_cabin_practicality atoms — bottle holders + cupholders as numbers.
    'bottle holders': norm('storage_cabin_practicality', 'bottle_holders', 'storage_cabin_practicality.bottle_holders', 'number'),
    'cupholders front': norm('storage_cabin_practicality', 'cupholders_front', 'storage_cabin_practicality.cupholders_front', 'number'),
    'cupholders rear': norm('storage_cabin_practicality', 'cupholders_rear', 'storage_cabin_practicality.cupholders_rear', 'number'),
    'boot open warning': raw('safety', 'boot_open_warning', 'boolean'),
    'lockable glovebox': raw('interior', 'lockable_glovebox', 'boolean'),
    'foldable seatback table': raw('interior', 'seatback_table', 'boolean'),
    // ─── Warning & alerts ─────────────────────────────────────────────────────
    'overspeed warning with 1 beep over 80kmph continuous beeps over 120kmph': norm('safety', 'speed_alert', 'safety.speed_alert', 'boolean'),
    'headlight and ignition on reminder': raw('safety', 'headlight_ignition_reminder', 'boolean'),
    'auto crash alert': norm('safety', 'crash_sensor', 'safety.crash_sensor', 'boolean'),
    'tow away alert': raw('safety', 'tow_away_alert', 'boolean'),
    'perimetric alarm system': raw('safety', 'anti_theft_alarm', 'boolean'),
    'dual tone horn': raw('exterior', 'dual_tone_horn', 'boolean'),
    // ─── Warranty ─────────────────────────────────────────────────────────────
    'battery warranty': raw('warranty', 'battery_warranty', 'string'),
    'motor warranty in years': raw('warranty', 'motor_warranty_years', 'string'),
    'motor warranty in kilometres': raw('warranty', 'motor_warranty_km', 'string'),
    'vehicle warranty': raw('warranty', 'vehicle_warranty', 'string'),
    // ─── Instrument cluster (additional CarWale patterns) ─────────────────────
    // "Instrument Cluster" variants pre-normalized in CarWaleExtractor → "Instrument Cluster"
    // 'instrument cluster' already exists above
    'cabin lamp': raw('exterior', 'cabin_lamp', 'boolean'),
    'total cng mode time': raw('interior', 'cng_mode_time', 'boolean'),
    // ─── Infotainment further aliases ─────────────────────────────────────────
    'input methods': raw('infotainment_connectivity', 'input_methods', 'string'),
    'gesture control': raw('infotainment_connectivity', 'gesture_control', 'boolean'),
    'shark fin antenna': raw('exterior', 'shark_fin_antenna', 'boolean'),
    'audio system': raw('infotainment_connectivity', 'audio_system', 'boolean'),
    'integrated in dash music system': raw('infotainment_connectivity', 'music_system', 'boolean'),
    '12v power outlet': raw('comfort_convenience', 'power_outlet', 'boolean'),
    '1 x 12v power outlet': raw('comfort_convenience', 'power_outlet', 'boolean'),
    'speed dependent volume': raw('infotainment_connectivity', 'speed_dependent_volume', 'boolean'),
    'whatsapp and text readout': raw('infotainment_connectivity', 'whatsapp_readout', 'boolean'),
    'roof mounted antenna': raw('exterior', 'roof_mounted_antenna', 'boolean'),
    // ─── Steering further alias ───────────────────────────────────────────────
    'power assisted hydraulic steering': norm('suspension_steering_brakes', 'steering_type', 'suspension_steering_brakes.steering_type', 'string'),
    // ─── TPMS alias without acronym ───────────────────────────────────────────
    'tyre pressure monitoring system': raw('safety', 'tpms', 'boolean'),
    // ─── Seating (pre-normalized by extractor) ────────────────────────────────
    // "N way adjustable" seat labels are normalized in CarWaleExtractor
    'driver seat adjustment': raw('interior', 'driver_seat_adjustment', 'string'),
    'front passenger seat adjustment': raw('interior', 'passenger_seat_adjustment', 'string'),
    'second row seat adjustment': raw('interior', 'second_row_seat_adjustment', 'string'),
    'third row seat adjustment': raw('interior', 'third_row_seat_adjustment', 'string'),
    // "N Cupholders in X" pre-normalized to "Cup Holders" in CarWaleExtractor
    // 'cup holders' already exists above
    'boss mode': raw('comfort_convenience', 'boss_mode', 'boolean'),
    '5 star child safety rating': raw('safety', 'ncap_child_rating', 'string'),
    'front seat height adjustable seat belt': raw('safety', 'height_adjustable_seatbelt', 'boolean'),
    'all rows comfort headrest': raw('interior', 'comfort_headrest', 'boolean'),
    // ─── Design & styling further ─────────────────────────────────────────────
    'cladding black grey body kit': raw('exterior', 'cladding', 'boolean'),
    'black single tone interiors': raw('interior', 'interior_theme', 'string'),
    'single tone interiors': raw('interior', 'interior_theme', 'string'),
    'exhaust': raw('exterior', 'exhaust_type', 'string'),
    'wrappings': raw('exterior', 'wrappings', 'boolean'),
    'parametric radiator grille': raw('exterior', 'grille_type', 'string'),
    // ─── Doors / mirrors further ──────────────────────────────────────────────
    'painted interior door handles finish': raw('exterior', 'door_handle_finish', 'string'),
    'body coloured door handles': raw('exterior', 'door_handle_finish', 'string'),
    'chrome interior door handles finish': raw('exterior', 'door_handle_finish', 'string'),
    'silver interior door handles finish': raw('exterior', 'door_handle_finish', 'string'),
    'body coloured door handles and pull handle type': raw('exterior', 'door_handle_finish', 'string'),
    'painted finish on exterior door handles and pull handle type': raw('exterior', 'door_handle_finish', 'string'),
    'chrome finish on exterior door handles and pull handle type': raw('exterior', 'door_handle_finish', 'string'),
    'orvms with body coloured finish': raw('exterior', 'orvm_finish', 'string'),
    'body coloured finished orvms with integrated turn indicators': raw('exterior', 'orvm_finish', 'string'),
    'piano black finished orvms with integrated turn indicators': raw('exterior', 'orvm_finish', 'string'),
    'anti glare orvms': raw('exterior', 'anti_glare_orvm', 'boolean'),
    'vanity mirrors on sun visors': raw('interior', 'vanity_mirror', 'boolean'),
    'co driver sun visor with vanity mirror': raw('interior', 'vanity_mirror', 'boolean'),
    'co driver extendable sun visor': raw('interior', 'vanity_mirror', 'boolean'),
    'manual dimming inside rear view mirror irvm': raw('exterior', 'manual_dimming_irvm', 'boolean'),
    'inside rear view mirror irvm': raw('exterior', 'inside_rvm', 'boolean'),
    'internal boot opener with remote': raw('comfort_convenience', 'internal_boot_opener', 'boolean'),
    'internal boot opener with key': raw('comfort_convenience', 'internal_boot_opener', 'boolean'),
    'integrated washer jets with wiper': raw('exterior', 'washer_jets', 'boolean'),
    'manual fuel fillers lid': raw('exterior', 'fuel_lid_type', 'string'),
    'parking assist with reverse camera with guidance': norm('safety', 'rear_camera', 'safety.rear_camera', 'boolean'),
    // ─── Lighting further ─────────────────────────────────────────────────────
    'cabin lamp front and rear and reading lamp': raw('exterior', 'cabin_lamp', 'boolean'),
    'cabin lamp front and rear': raw('exterior', 'cabin_lamp', 'boolean'),
    'connected led': norm('exterior', 'connected_led_taillight', 'exterior.connected_led_taillight', 'boolean'),
    'connected led headlight and taillight': norm('exterior', 'connected_led_taillight', 'exterior.connected_led_taillight', 'boolean'),
    'connected led taillight': norm('exterior', 'connected_led_taillight', 'exterior.connected_led_taillight', 'boolean'),
    'connected led taillights': norm('exterior', 'connected_led_taillight', 'exterior.connected_led_taillight', 'boolean'),
    'front and orvms sequential turn indicators': raw('exterior', 'sequential_turn_indicators', 'boolean'),
    'front and rear sequential turn indicators': raw('exterior', 'sequential_turn_indicators', 'boolean'),
    'stop lamp': raw('exterior', 'stop_lamp', 'boolean'),
    'reflectors': raw('exterior', 'reflectors', 'boolean'),
    'reflectors with rear bumper': raw('exterior', 'reflectors', 'boolean'),
    // ─── Connected car further ────────────────────────────────────────────────
    'in car payment': raw('connected_car', 'in_car_payment', 'boolean'),
    'call reject with sms': raw('connected_car', 'call_reject_sms', 'boolean'),
    'live traffic updates on app': raw('connected_car', 'live_traffic_updates', 'boolean'),
    'location based services': raw('connected_car', 'location_services', 'boolean'),
    'smart drive information': raw('connected_car', 'smart_drive_info', 'boolean'),
    'find and book parking slot': raw('connected_car', 'parking_slot_finder', 'boolean'),
    'remote air purifier operation': raw('connected_car', 'remote_air_purifier', 'boolean'),
    'sim service provider': raw('connected_car', 'sim_service', 'string'),
    // ─── Storage further ──────────────────────────────────────────────────────
    'bottle holder in doors': raw('interior', 'door_pockets', 'boolean'),
    'cupholders in front and second row': raw('comfort_convenience', 'cup_holders', 'string'),
    'third row cup holders': raw('comfort_convenience', 'cup_holders', 'string'),
    'heated cooled cup holders': raw('comfort_convenience', 'cup_holders', 'string'),
    // ─── Interior theme / dual tone variants ──────────────────────────────────
    'black rub strips': raw('exterior', 'rub_strips', 'boolean'),
    'ocean and black dual tone interiors': raw('interior', 'interior_theme', 'string'),
    'black and greige dual tone interiors': raw('interior', 'interior_theme', 'string'),
    'beige and black dual tone interiors': raw('interior', 'interior_theme', 'string'),
    'special badging': raw('exterior', 'special_badging', 'boolean'),
    // ─── Infotainment misc ────────────────────────────────────────────────────
    'noise levels': raw('infotainment_connectivity', 'noise_levels', 'string'),
    'medium noise levels': raw('infotainment_connectivity', 'noise_levels', 'string'),
    'low noise levels': raw('infotainment_connectivity', 'noise_levels', 'string'),
    'ambient sounds': raw('infotainment_connectivity', 'ambient_sounds', 'boolean'),
    'inbuilt music app': raw('infotainment_connectivity', 'music_system', 'boolean'),
    'jio saavan inbuilt music app': raw('infotainment_connectivity', 'music_system', 'boolean'),
    'what3words address based navigation': norm('infotainment_connectivity', 'navigation', 'infotainment_connectivity.navigation', 'boolean'),
    'pre loaded major apps in infotainment': raw('infotainment_connectivity', 'preloaded_apps', 'boolean'),
    // "N x USB Type-C, USB Type-A, 12V Power Outlet" → usb ports
    '2 x usb type c usb type a 12v power outlet': raw('infotainment_connectivity', 'usb_ports_present', 'boolean'),
    // ─── Instrument cluster further ───────────────────────────────────────────
    'digital and analog speedometer': norm('interior', 'instrument_cluster', 'interior.instrument_cluster', 'string'),
    // ══════════════════════════════════════════════════════════════════════════
    // Batch 1+2 — driver_display_controls sub-section (new typed home).
    // Most of these duplicate labels that also exist for interior/safety/comfort —
    // a label like "heads up display" lands in BOTH driver_display_controls.heads_up_display
    // AND specs_raw.hud (the older mapping). We keep both wires hot so downstream
    // code that reads either path keeps working.
    // ══════════════════════════════════════════════════════════════════════════
    'heads up display': norm('driver_display_controls', 'heads_up_display', 'driver_display_controls.heads_up_display', 'boolean'),
    'head up display': norm('driver_display_controls', 'heads_up_display', 'driver_display_controls.heads_up_display', 'boolean'),
    'distance to empty': norm('driver_display_controls', 'distance_to_empty', 'driver_display_controls.distance_to_empty', 'boolean'),
    'distance to empty display': norm('driver_display_controls', 'distance_to_empty', 'driver_display_controls.distance_to_empty', 'boolean'),
    'driving efficiency display': norm('driver_display_controls', 'driving_efficiency_display', 'driver_display_controls.driving_efficiency_display', 'boolean'),
    'driving efficiency': norm('driver_display_controls', 'driving_efficiency_display', 'driver_display_controls.driving_efficiency_display', 'boolean'),
    'efficiency display': norm('driver_display_controls', 'driving_efficiency_display', 'driver_display_controls.driving_efficiency_display', 'boolean'),
};
// Labels we never want to map — UI control text that leaks from extraction.
exports.INVALID_LABELS = [
    'report incorrect specs',
    'report incorrect',
    'click to report',
    'report',
    'incorrect',
    'edit',
    'modify',
    'update specs',
];
// Value normalization — vocabularies for boolean-type fields.
const POSITIVE_BOOLEAN_VALUES = new Set([
    'yes', 'true', 'available', 'standard', 'with', 'powered',
    'included', 'comes with', 'fitted', 'equipped', 'has',
]);
const NEGATIVE_BOOLEAN_VALUES = new Set([
    'no', 'false', 'not available', 'none', 'na', 'n/a', '0',
    'not equipped', 'not fitted', 'absent', '-',
]);
function normalizeLabel(label) {
    return label
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function isInvalidLabel(label) {
    const normalized = normalizeLabel(label);
    return exports.INVALID_LABELS.some(invalid => normalized.includes(invalid));
}
function getSpecMapping(label) {
    const normalized = normalizeLabel(label);
    return exports.SPEC_LABEL_MAP[normalized] || null;
}
const UNIT_PATTERNS = [
    // Mileage → "X kmpl"
    { regex: /^([\d.]+)\s*(?:kmpl|km\/l|km per litre|km per liter|kpl)$/i, format: n => `${n} kmpl` },
    // Battery / energy → "X kWh"
    { regex: /^([\d.]+)\s*(?:kwh|kw-h|kilowatt[\s-]hours?)$/i, format: n => `${n} kWh` },
    // Power → "X kW"
    { regex: /^([\d.]+)\s*(?:kw|kilowatts?)$/i, format: n => `${n} kW` },
    // Power → "X bhp"
    { regex: /^([\d.]+)\s*(?:bhp|brake horsepower)$/i, format: n => `${n} bhp` },
    // Power → "X ps"
    { regex: /^([\d.]+)\s*(?:ps|pferdestärke)$/i, format: n => `${n} ps` },
    // Torque → "X Nm"
    { regex: /^([\d.]+)\s*(?:nm|newton[\s-]meters?)$/i, format: n => `${n} Nm` },
    // Volume (tank/boot) → "X L"
    { regex: /^([\d.]+)\s*(?:l|litres?|liters?|ltrs?)$/i, format: n => `${n} L` },
    // Displacement → "X cc"
    { regex: /^([\d.]+)\s*(?:cc|cm3|cm³)$/i, format: n => `${n} cc` },
    // Weight → "X kg"
    { regex: /^([\d.]+)\s*(?:kg|kilograms?)$/i, format: n => `${n} kg` },
    // Dimension → "X mm"
    { regex: /^([\d.]+)\s*(?:mm|millimetres?|millimeters?)$/i, format: n => `${n} mm` },
    // Speed → "X kmph"
    { regex: /^([\d.]+)\s*(?:kmph|km\/h|kph)$/i, format: n => `${n} kmph` },
    // Range → "X km"
    { regex: /^([\d.]+)\s*(?:km|kilometres?|kilometers?)$/i, format: n => `${n} km` },
    // RPM → "X rpm"
    { regex: /^([\d.]+)\s*(?:rpm|rev(?:olutions)? per min(?:ute)?)$/i, format: n => `${n} rpm` },
];
function normalizeUnitString(value) {
    for (const { regex, format } of UNIT_PATTERNS) {
        const match = value.match(regex);
        if (match)
            return format(match[1]);
    }
    return value;
}
function parseSpecValue(value, type) {
    if (!value)
        return null;
    const trimmed = value.trim();
    switch (type) {
        case 'number': {
            const numMatch = trimmed.match(/[\d.]+/);
            if (numMatch) {
                const num = parseFloat(numMatch[0]);
                return isNaN(num) ? null : num;
            }
            return null;
        }
        case 'boolean': {
            const lower = trimmed.toLowerCase();
            if (POSITIVE_BOOLEAN_VALUES.has(lower))
                return true;
            if (NEGATIVE_BOOLEAN_VALUES.has(lower))
                return false;
            if (lower.startsWith('optional'))
                return false;
            // Any other non-empty descriptor → present.
            return true;
        }
        case 'array': {
            return trimmed
                .split(/[|,]/)
                .map(s => s.trim())
                .filter(s => s.length > 0);
        }
        case 'transmission':
            return trimmed;
        case 'string':
        default:
            return normalizeUnitString(trimmed);
    }
}
function guessCategory(label, section) {
    const lowerLabel = label.toLowerCase();
    const lowerSection = section.toLowerCase();
    if (lowerLabel.includes('battery') || lowerLabel.includes('charging') ||
        lowerLabel.includes('electric range') || lowerLabel.includes('motor type') ||
        lowerLabel.includes('motor power') || lowerLabel.includes('regenerative') ||
        (lowerLabel.includes('range') && !lowerLabel.includes('price'))) {
        return 'battery_charging';
    }
    if (lowerLabel.includes('engine') || lowerLabel.includes('displacement') ||
        lowerLabel.includes('cylinder') || lowerLabel.includes('turbo') ||
        lowerLabel.includes('valve') || lowerLabel.includes('fuel system') ||
        lowerLabel.includes('acceleration') || lowerLabel.includes('0-100') ||
        lowerLabel.includes('0100kmph') || lowerLabel.includes('top speed')) {
        return 'engine_performance';
    }
    if (lowerLabel.includes('suspension') || lowerLabel.includes('steering') ||
        lowerLabel.includes('shock absorber') || lowerLabel.includes('turning radius') ||
        lowerLabel.includes('brake type') || lowerLabel.includes('parking brake')) {
        return 'suspension_steering_brakes';
    }
    if (lowerLabel.includes('adaptive') || lowerLabel.includes('lane') ||
        lowerLabel.includes('collision') || lowerLabel.includes('blind spot') ||
        lowerLabel.includes('traffic sign') || lowerLabel.includes('cross traffic') ||
        lowerLabel.includes('driver attention') || lowerLabel.includes('emergency braking')) {
        return 'adas';
    }
    if (lowerLabel.includes('airbag') || lowerLabel.includes('camera') ||
        lowerLabel.includes('sensor') || lowerLabel.includes('ncap') ||
        lowerLabel.includes('isofix') || lowerLabel.includes('seatbelt') ||
        lowerLabel.includes('seat belt') || lowerLabel.includes('abs') ||
        lowerLabel.includes('ebd') || lowerLabel.includes('esp') ||
        lowerLabel.includes('traction control') || lowerLabel.includes('hill hold') ||
        lowerLabel.includes('hill descent') || lowerLabel.includes('immobilizer') ||
        lowerLabel.includes('central locking') || lowerLabel.includes('child safety')) {
        return 'safety';
    }
    if (lowerLabel.includes('touchscreen') || lowerLabel.includes('speaker') ||
        lowerLabel.includes('android') || lowerLabel.includes('apple') ||
        lowerLabel.includes('carplay') || lowerLabel.includes('bluetooth') ||
        lowerLabel.includes('navigation') || lowerLabel.includes('usb') ||
        lowerLabel.includes('wireless charging') || lowerLabel.includes('wifi') ||
        lowerLabel.includes('voice') || lowerLabel.includes('ota')) {
        return 'infotainment_connectivity';
    }
    if (lowerLabel.includes('e call') || lowerLabel.includes('ecall') ||
        lowerLabel.includes('sos') || lowerLabel.includes('geofenc') ||
        lowerLabel.includes('vehicle tracking') || lowerLabel.includes('remote vehicle')) {
        return 'connected_car';
    }
    if (lowerLabel.includes('length') || lowerLabel.includes('width') ||
        lowerLabel.includes('height') || lowerLabel.includes('wheelbase') ||
        lowerLabel.includes('wheel base') || lowerLabel.includes('ground clearance') ||
        lowerLabel.includes('boot space') || lowerLabel.includes('kerb weight') ||
        lowerLabel.includes('gross') || lowerLabel.includes('door') ||
        lowerLabel.includes('seating capacity')) {
        return 'dimensions_practicality';
    }
    if (lowerLabel.includes('seat') || lowerLabel.includes('headrest') ||
        lowerLabel.includes('armrest') || lowerLabel.includes('window') ||
        lowerLabel.includes('cup holder') || lowerLabel.includes('drive mode') ||
        lowerLabel.includes('climate') || lowerLabel.includes('air conditioner') ||
        lowerLabel.includes('sunroof') || lowerLabel.includes('cruise control') ||
        lowerLabel.includes('paddle shift') || lowerLabel.includes('keyless') ||
        lowerLabel.includes('push button') || lowerLabel.includes('remote start')) {
        return 'comfort_convenience';
    }
    if (lowerLabel.includes('antenna') || lowerLabel.includes('orvm') ||
        lowerLabel.includes('headlight') || lowerLabel.includes('headlamp') ||
        lowerLabel.includes('tail light') || lowerLabel.includes('taillight') ||
        lowerLabel.includes('fog') || lowerLabel.includes('drl') ||
        lowerLabel.includes('roof rail') || lowerLabel.includes('spoiler') ||
        lowerLabel.includes('boot opening') || lowerLabel.includes('body color') ||
        lowerLabel.includes('led')) {
        return 'exterior';
    }
    if (lowerLabel.includes('tyre') || lowerLabel.includes('wheel') ||
        lowerLabel.includes('rim') || lowerLabel.includes('alloy')) {
        return 'tyres_wheels';
    }
    if (lowerLabel.includes('dashboard') || lowerLabel.includes('interior') ||
        lowerLabel.includes('upholstery') || lowerLabel.includes('instrument cluster') ||
        lowerLabel.includes('ambient') || lowerLabel.includes('sunblind') ||
        lowerLabel.includes('digital cluster') || lowerLabel.includes('tachometer')) {
        return 'interior';
    }
    if (lowerLabel.includes('mileage') || lowerLabel.includes('fuel tank') ||
        lowerLabel.includes('emission')) {
        return 'mileage_range';
    }
    if (lowerLabel.includes('warranty')) {
        return 'warranty';
    }
    // Section-name fallback
    if (lowerSection.includes('engine') || lowerSection.includes('transmission') ||
        lowerSection.includes('motor')) {
        return 'engine_performance';
    }
    if (lowerSection.includes('dimension') || lowerSection.includes('capacity') ||
        lowerSection.includes('weight')) {
        return 'dimensions_practicality';
    }
    if (lowerSection.includes('adas')) {
        return 'adas';
    }
    if (lowerSection.includes('safety') || lowerSection.includes('security')) {
        return 'safety';
    }
    if (lowerSection.includes('comfort') || lowerSection.includes('convenience')) {
        return 'comfort_convenience';
    }
    if (lowerSection.includes('interior')) {
        return 'interior';
    }
    if (lowerSection.includes('exterior') || lowerSection.includes('look')) {
        return 'exterior';
    }
    if (lowerSection.includes('entertainment') || lowerSection.includes('infotainment') ||
        lowerSection.includes('communication') || lowerSection.includes('audio')) {
        return 'infotainment_connectivity';
    }
    if (lowerSection.includes('internet') || lowerSection.includes('connected')) {
        return 'connected_car';
    }
    return 'specs_raw';
}
const stripNoLike = (v) => {
    if (v === null || v === undefined)
        return false;
    if (typeof v === 'boolean')
        return v;
    if (typeof v === 'number')
        return v !== 0;
    if (typeof v === 'string') {
        const lower = v.trim().toLowerCase();
        if (!lower)
            return false;
        return !NEGATIVE_BOOLEAN_VALUES.has(lower) && !lower.startsWith('optional');
    }
    return Boolean(v);
};
const countTrue = (obj) => {
    if (!obj)
        return 0;
    return Object.values(obj).filter(v => v === true).length;
};
function deriveFeatureFlags(specs_normalized, specs_raw, rootFields) {
    const derived = {};
    // ── Sunroof ─────────────────────────────────────────────────────────────
    const interior = specs_normalized.interior;
    const sunroofRaw = interior?.sunroof;
    const panoramicFlag = interior?.panoramic_sunroof;
    const moonroofFlag = interior?.moonroof;
    const sunroofPresent = stripNoLike(sunroofRaw) || panoramicFlag === true || moonroofFlag === true;
    if (sunroofPresent) {
        derived.has_sunroof = true;
        const sunroofStr = typeof sunroofRaw === 'string' ? sunroofRaw.toLowerCase() : '';
        if (panoramicFlag === true || /panoramic/.test(sunroofStr)) {
            derived.sunroof_type = 'panoramic';
            derived.has_panoramic_sunroof = true;
        }
        else if (moonroofFlag === true || /moonroof/.test(sunroofStr)) {
            derived.sunroof_type = 'moonroof';
        }
        else {
            derived.sunroof_type = 'standard';
        }
    }
    // ── Airbags ─────────────────────────────────────────────────────────────
    const airbags = specs_normalized.safety?.airbags;
    if (typeof airbags === 'number' && airbags >= 0) {
        derived.airbag_count = airbags;
        derived.has_airbags = airbags > 0;
        if (airbags >= 2)
            derived.has_2_airbags = true;
        if (airbags >= 4)
            derived.has_4_airbags = true;
        if (airbags >= 6)
            derived.has_6_airbags = true;
        if (airbags >= 8)
            derived.has_8_airbags = true;
    }
    // ── NCAP safety rating ──────────────────────────────────────────────────
    // Prefer the Batch 1+2 typed fields. Fall back to the legacy specs_raw paths
    // for imports that pre-date the schema promotion (won't be present going forward).
    const safety = specs_normalized.safety;
    const ncapStars = Math.max(typeof safety?.ncap_rating === 'number' ? safety.ncap_rating : 0, typeof safety?.bncap_rating === 'number' ? safety.bncap_rating : 0, typeof safety?.global_ncap_rating === 'number' ? safety.global_ncap_rating : 0, (() => {
        const legacyRaw = specs_raw?.bharat_ncap_safety_rating ?? specs_raw?.global_ncap_safety_rating;
        return legacyRaw
            ? parseInt(String(legacyRaw).match(/\d+/)?.[0] || '0', 10)
            : 0;
    })());
    if (ncapStars > 0) {
        derived.ncap_stars = ncapStars;
        if (ncapStars >= 5)
            derived.is_5_star_safety = true;
        else if (ncapStars >= 4)
            derived.is_4_star_safety = true;
    }
    // ── ADAS ────────────────────────────────────────────────────────────────
    const adas = specs_normalized.adas;
    const adasCount = countTrue(adas);
    if (adasCount > 0) {
        derived.has_adas = true;
        derived.adas_count = adasCount;
        if (adasCount >= 5)
            derived.has_full_adas = true;
    }
    if (adas?.adaptive_cruise_control === true)
        derived.has_adaptive_cruise = true;
    // ── Lighting ────────────────────────────────────────────────────────────
    const ex = specs_normalized.exterior;
    if (ex?.led_headlights === true)
        derived.has_led_headlights = true;
    if (ex?.drl === true)
        derived.has_led_drls = true;
    if (ex?.led_headlights === true && ex?.led_tail_lights === true && ex?.drl === true) {
        derived.has_full_led_package = true;
    }
    // ── Powertrain flags ────────────────────────────────────────────────────
    const fuel = (rootFields?.fuel_type || '').toLowerCase();
    if (fuel.includes('electric') || specs_normalized.battery_charging?.battery_capacity) {
        derived.is_ev = true;
    }
    if (fuel.includes('hybrid'))
        derived.is_hybrid = true;
    if (specs_normalized.engine_performance?.turbocharger === true)
        derived.is_turbo = true;
    // ── Headliner comfort/safety toggles ────────────────────────────────────
    if (specs_normalized.infotainment_connectivity?.wireless_charging === true) {
        derived.has_wireless_charging = true;
    }
    if (specs_normalized.safety?.camera_360 === true) {
        derived.has_360_camera = true;
    }
    if (specs_normalized.safety?.rear_camera === true) {
        derived.has_rear_camera = true;
    }
    if (specs_normalized.safety?.parking_sensors && String(specs_normalized.safety.parking_sensors).trim()) {
        derived.has_parking_sensors = true;
    }
    if (specs_normalized.comfort_convenience?.ventilated_seats &&
        stripNoLike(specs_normalized.comfort_convenience.ventilated_seats)) {
        derived.has_ventilated_seats = true;
    }
    if (specs_normalized.tyres_wheels?.alloy_wheels === true) {
        derived.has_alloy_wheels = true;
    }
    if (specs_normalized.comfort_convenience?.cruise_control === true) {
        derived.has_cruise_control = true;
    }
    if (specs_normalized.comfort_convenience?.automatic_climate_control === true) {
        derived.has_auto_climate = true;
    }
    if (specs_normalized.comfort_convenience?.push_button_start === true) {
        derived.has_push_button_start = true;
    }
    // ── Connected car ───────────────────────────────────────────────────────
    const cc = specs_normalized.connected_car;
    const ccCount = countTrue(cc);
    if (ccCount > 0)
        derived.has_connected_car = true;
    if (cc?.app_connectivity === true)
        derived.has_app_connectivity = true;
    return derived;
}
//# sourceMappingURL=spec-key-map.js.map