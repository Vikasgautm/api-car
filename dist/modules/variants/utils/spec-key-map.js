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
    'super charger': raw('engine_performance', 'super_charger', 'boolean'),
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
    'regenerative braking levels': raw('battery_charging', 'regenerative_braking_levels', 'number'),
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
    'tyre pressure monitoring system tpms': raw('safety', 'tpms', 'boolean'),
    'tpms': raw('safety', 'tpms', 'boolean'),
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
    'bharat ncap safety rating': raw('safety', 'bharat_ncap_safety_rating', 'string'),
    'bharat ncap child safety rating': raw('safety', 'bharat_ncap_child_safety_rating', 'string'),
    'global ncap safety rating': raw('safety', 'global_ncap_safety_rating', 'string'),
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
    'driver attention warning': raw('adas', 'driver_attention_warning', 'boolean'),
    'adaptive high beam assist': raw('adas', 'adaptive_high_beam_assist', 'boolean'),
    'rear cross traffic alert': raw('adas', 'rear_cross_traffic_alert', 'boolean'),
    'rear cross traffic collision avoidance assist': raw('adas', 'rear_cross_traffic_collision_avoidance_assist', 'boolean'),
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
    'remote engine start': norm('comfort_convenience', 'remote_start', 'comfort_convenience.remote_start', 'boolean'),
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
    // ─── EXTERIOR ─────────────────────────────────────────────────────────────
    'rain sensing wiper': raw('exterior', 'rain_sensing_wiper', 'boolean'),
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
/**
 * Parse a CarDekho-style spec value into the target type.
 *
 * Boolean handling is permissive on the positive side: any non-empty value
 * that is not in NEGATIVE_BOOLEAN_VALUES is treated as `true`. This is
 * deliberate — CarDekho frequently encodes presence as positional/descriptive
 * text ("Front Only", "All 4", "Driver and Passenger", "Bench Folding",
 * "Integrated", "With Storage", "Powered"). When the mapping declares
 * `type: 'boolean'`, the field is asking "does this car have feature X?" and
 * any descriptor implies yes. "Optional" is treated as false, since SEO
 * categories like "cars with sunroof" should only advertise standard fitment.
 */
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
            return trimmed;
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
    const ncapRaw = specs_raw?.bharat_ncap_safety_rating ??
        specs_raw?.global_ncap_safety_rating;
    if (ncapRaw) {
        const stars = parseInt(String(ncapRaw).match(/\d+/)?.[0] || '0', 10);
        if (stars > 0) {
            derived.ncap_stars = stars;
            if (stars >= 5)
                derived.is_5_star_safety = true;
            else if (stars >= 4)
                derived.is_4_star_safety = true;
        }
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