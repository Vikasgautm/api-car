"use strict";
/**
 * Import Normalizer Service
 * Orchestrates normalization of raw imported specs_raw into clean specs_normalized
 *
 * Flow:
 * 1. Accepts specs_raw (messy imported data)
 * 2. Cleans strings (spaces, casing, punctuation)
 * 3. Normalizes booleans (yes/no/na → true/false/null)
 * 4. Maps semantic names (synonyms → canonical keys)
 * 5. Extracts numbers from formatted text ("60 kWh" → 60)
 * 6. Returns specs_normalized with confidence scores
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportNormalizerService = void 0;
const boolean_normalizer_1 = require("../normalizers/boolean-normalizer");
const string_normalizer_1 = require("../normalizers/string-normalizer");
const semantic_normalizer_1 = require("../normalizers/semantic-normalizer");
class ImportNormalizerService {
    /**
     * Normalize all specs from a raw import
     */
    static normalize(specs_raw = {}) {
        const mappingDetails = {};
        const unmappedKeys = [];
        let mappedCount = 0;
        let unmappedCount = 0;
        let estimatedCount = 0;
        const specs_normalized = {};
        // Process each field in raw specs
        for (const [rawKey, rawValue] of Object.entries(specs_raw)) {
            const normalized = this.normalizeField(rawKey, rawValue);
            if (normalized.success && normalized.path) {
                mappedCount++;
                // Store normalized value
                const [category, fieldKey] = normalized.path;
                if (!specs_normalized[category]) {
                    specs_normalized[category] = {};
                }
                const categoryObj = specs_normalized[category];
                categoryObj[fieldKey] = normalized.value;
                mappingDetails[rawKey] = {
                    original: rawValue,
                    normalized: normalized.value,
                    confidence: normalized.confidence,
                    is_estimated: normalized.is_estimated,
                    canonical_key: normalized.canonical_key,
                };
                if (normalized.is_estimated) {
                    estimatedCount++;
                }
            }
            else {
                unmappedCount++;
                unmappedKeys.push({
                    key: rawKey,
                    raw_value: rawValue,
                    attempted_mapping: normalized.attempted_mapping,
                });
            }
        }
        const totalProcessed = mappedCount + unmappedCount;
        const overallConfidence = totalProcessed > 0 ? mappedCount / totalProcessed : 0;
        return {
            specs_normalized,
            normalization_stats: {
                total_fields_processed: totalProcessed,
                mapped_fields: mappedCount,
                unmapped_fields: unmappedCount,
                estimated_fields: estimatedCount,
                overall_confidence: overallConfidence,
            },
            unmapped_keys: unmappedKeys,
            mapping_details: mappingDetails,
        };
    }
    /**
     * Normalize a single field
     * Returns: { success, value, confidence, is_estimated, path, canonical_key, attempted_mapping }
     */
    static normalizeField(rawKey, rawValue) {
        // Try semantic mapping first (feature names)
        const semanticResult = semantic_normalizer_1.SemanticNormalizer.normalize(rawKey);
        if (semanticResult.is_mapped) {
            // Semantic match: field is a feature name like "Wireless Charger"
            const normalizedValue = this.normalizeValueForType(rawValue, 'boolean');
            return {
                success: true,
                value: normalizedValue.value,
                confidence: semanticResult.confidence * normalizedValue.confidence,
                is_estimated: normalizedValue.is_estimated,
                path: [semanticResult.category, semanticResult.canonical_key],
                canonical_key: semanticResult.canonical_key,
            };
        }
        // Try direct key mapping (numeric specs)
        const directMapping = this.mapRawKeyToNormalized(rawKey);
        if (directMapping) {
            const normalizedValue = this.normalizeValueForType(rawValue, directMapping.type);
            return {
                success: true,
                value: normalizedValue.value,
                confidence: normalizedValue.confidence,
                is_estimated: normalizedValue.is_estimated,
                path: [directMapping.category, directMapping.key],
            };
        }
        // Unmapped
        return {
            success: false,
            attempted_mapping: `could not map "${rawKey}" to any known field`,
        };
    }
    /**
     * Map raw key names to normalized field path
     * E.g. "engine_displacement_cc" → { category: "engine_performance", key: "displacement" }
     */
    static mapRawKeyToNormalized(rawKey) {
        // Normalize the key for matching
        const normalized = string_normalizer_1.StringNormalizer.normalizeForLookup(rawKey);
        // Direct mappings from common raw field names
        const mappings = {
            // Engine & Performance (underscore keys)
            engine_displacement_cc: { category: 'engine_performance', key: 'displacement', type: 'string' },
            displacement_cc: { category: 'engine_performance', key: 'displacement', type: 'string' },
            engine_displacement: { category: 'engine_performance', key: 'displacement', type: 'string' },
            displacement: { category: 'engine_performance', key: 'displacement', type: 'string' },
            max_power_bhp: { category: 'engine_performance', key: 'max_power', type: 'string' },
            power_bhp: { category: 'engine_performance', key: 'max_power', type: 'string' },
            max_power: { category: 'engine_performance', key: 'max_power', type: 'string' },
            max_torque_nm: { category: 'engine_performance', key: 'max_torque', type: 'string' },
            torque_nm: { category: 'engine_performance', key: 'max_torque', type: 'string' },
            max_torque: { category: 'engine_performance', key: 'max_torque', type: 'string' },
            cylinders: { category: 'engine_performance', key: 'cylinders', type: 'number' },
            valves_per_cylinder: { category: 'engine_performance', key: 'valves_per_cylinder', type: 'number' },
            turbocharger: { category: 'engine_performance', key: 'turbocharger', type: 'boolean' },
            supercharger: { category: 'engine_performance', key: 'supercharger', type: 'boolean' },
            // Engine & Performance (space-based keys from CarDekho/human-readable sources)
            'engine displacement': { category: 'engine_performance', key: 'displacement', type: 'string' },
            'engine displacement cc': { category: 'engine_performance', key: 'displacement', type: 'string' },
            'max power': { category: 'engine_performance', key: 'max_power', type: 'string' },
            'max torque': { category: 'engine_performance', key: 'max_torque', type: 'string' },
            'no of cylinders': { category: 'engine_performance', key: 'cylinders', type: 'number' },
            'number of cylinders': { category: 'engine_performance', key: 'cylinders', type: 'number' },
            'valves per cylinder': { category: 'engine_performance', key: 'valves_per_cylinder', type: 'number' },
            // Mileage & Range
            arai_mileage_kmpl: { category: 'mileage_range', key: 'arai_mileage', type: 'string' },
            city_mileage_kmpl: { category: 'mileage_range', key: 'city_mileage', type: 'string' },
            highway_mileage_kmpl: { category: 'mileage_range', key: 'highway_mileage', type: 'string' },
            fuel_tank_capacity_l: { category: 'mileage_range', key: 'fuel_tank_capacity', type: 'string' },
            'arai mileage': { category: 'mileage_range', key: 'arai_mileage', type: 'string' },
            'city mileage': { category: 'mileage_range', key: 'city_mileage', type: 'string' },
            'fuel tank capacity': { category: 'mileage_range', key: 'fuel_tank_capacity', type: 'string' },
            // Battery & Charging
            battery_capacity_kwh: { category: 'battery_charging', key: 'battery_capacity_kwh', type: 'number' },
            battery_capacity: { category: 'battery_charging', key: 'battery_capacity', type: 'string' },
            motor_power_kw: { category: 'battery_charging', key: 'motor_power_kw', type: 'string' },
            motor_torque_nm: { category: 'battery_charging', key: 'motor_torque_nm', type: 'string' },
            'battery capacity': { category: 'battery_charging', key: 'battery_capacity', type: 'string' },
            'motor power': { category: 'battery_charging', key: 'motor_power_kw', type: 'string' },
            // Dimensions
            length_mm: { category: 'dimensions_practicality', key: 'length', type: 'string' },
            width_mm: { category: 'dimensions_practicality', key: 'width', type: 'string' },
            height_mm: { category: 'dimensions_practicality', key: 'height', type: 'string' },
            wheelbase_mm: { category: 'dimensions_practicality', key: 'wheelbase', type: 'string' },
            ground_clearance_mm: { category: 'dimensions_practicality', key: 'ground_clearance', type: 'string' },
            boot_space_l: { category: 'dimensions_practicality', key: 'boot_space', type: 'string' },
            seating_capacity: { category: 'dimensions_practicality', key: 'seating_capacity', type: 'number' },
            'ground clearance': { category: 'dimensions_practicality', key: 'ground_clearance', type: 'string' },
            'boot space': { category: 'dimensions_practicality', key: 'boot_space', type: 'string' },
            'seating capacity': { category: 'dimensions_practicality', key: 'seating_capacity', type: 'number' },
            // Safety
            airbags: { category: 'safety', key: 'airbags', type: 'number' },
            ncap_rating: { category: 'safety', key: 'ncap_rating', type: 'number' },
            'number of airbags': { category: 'safety', key: 'airbags', type: 'number' },
            'ncap rating': { category: 'safety', key: 'ncap_rating', type: 'number' },
            'global ncap rating': { category: 'safety', key: 'ncap_rating', type: 'number' },
            // Comfort & Convenience
            wireless_charger: { category: 'comfort_convenience', key: 'wireless_charger', type: 'boolean' },
            'wireless charger': { category: 'comfort_convenience', key: 'wireless_charger', type: 'boolean' },
            wireless_charging: { category: 'comfort_convenience', key: 'wireless_charger', type: 'boolean' },
            'wireless charging': { category: 'comfort_convenience', key: 'wireless_charger', type: 'boolean' },
            sunroof: { category: 'comfort_convenience', key: 'sunroof', type: 'boolean' },
            panoramic_sunroof: { category: 'comfort_convenience', key: 'panoramic_sunroof', type: 'boolean' },
            'panoramic sunroof': { category: 'comfort_convenience', key: 'panoramic_sunroof', type: 'boolean' },
            ventilated_seats: { category: 'comfort_convenience', key: 'ventilated_seats', type: 'boolean' },
            'ventilated seats': { category: 'comfort_convenience', key: 'ventilated_seats', type: 'boolean' },
            cruise_control: { category: 'comfort_convenience', key: 'cruise_control', type: 'boolean' },
            'cruise control': { category: 'comfort_convenience', key: 'cruise_control', type: 'boolean' },
            keyless_entry: { category: 'comfort_convenience', key: 'keyless_entry', type: 'boolean' },
            'keyless entry': { category: 'comfort_convenience', key: 'keyless_entry', type: 'boolean' },
            push_button_start: { category: 'comfort_convenience', key: 'push_button_start', type: 'boolean' },
            'push button start': { category: 'comfort_convenience', key: 'push_button_start', type: 'boolean' },
            'button start': { category: 'comfort_convenience', key: 'push_button_start', type: 'boolean' },
            remote_start: { category: 'comfort_convenience', key: 'remote_start', type: 'boolean' },
            'remote start': { category: 'comfort_convenience', key: 'remote_start', type: 'boolean' },
            power_windows: { category: 'comfort_convenience', key: 'power_windows', type: 'string' },
            'power windows': { category: 'comfort_convenience', key: 'power_windows', type: 'string' },
            automatic_climate_control: { category: 'comfort_convenience', key: 'automatic_climate_control', type: 'boolean' },
            'automatic climate control': { category: 'comfort_convenience', key: 'automatic_climate_control', type: 'boolean' },
            'auto climate control': { category: 'comfort_convenience', key: 'automatic_climate_control', type: 'boolean' },
            air_quality_control: { category: 'comfort_convenience', key: 'air_quality_control', type: 'boolean' },
            'air quality control': { category: 'comfort_convenience', key: 'air_quality_control', type: 'boolean' },
            rear_ac_vents: { category: 'comfort_convenience', key: 'rear_ac_vents', type: 'boolean' },
            'rear ac vents': { category: 'comfort_convenience', key: 'rear_ac_vents', type: 'boolean' },
            heated_seats: { category: 'comfort_convenience', key: 'heated_seats', type: 'string' },
            'heated seats': { category: 'comfort_convenience', key: 'heated_seats', type: 'string' },
            memory_seats: { category: 'comfort_convenience', key: 'memory_seats', type: 'string' },
            'memory seats': { category: 'comfort_convenience', key: 'memory_seats', type: 'string' },
            lumbar_support: { category: 'comfort_convenience', key: 'lumbar_support', type: 'boolean' },
            'lumbar support': { category: 'comfort_convenience', key: 'lumbar_support', type: 'boolean' },
            seat_material: { category: 'comfort_convenience', key: 'seat_material', type: 'string' },
            'seat material': { category: 'comfort_convenience', key: 'seat_material', type: 'string' },
            'seat upholstery': { category: 'comfort_convenience', key: 'seat_material', type: 'string' },
            folding_rear_seats: { category: 'comfort_convenience', key: 'folding_rear_seats', type: 'string' },
            'folding rear seats': { category: 'comfort_convenience', key: 'folding_rear_seats', type: 'string' },
            rear_window_defogger: { category: 'comfort_convenience', key: 'rear_window_defogger', type: 'boolean' },
            'rear window defogger': { category: 'comfort_convenience', key: 'rear_window_defogger', type: 'boolean' },
            headlamp_washer: { category: 'comfort_convenience', key: 'headlamp_washer', type: 'boolean' },
            'headlamp washer': { category: 'comfort_convenience', key: 'headlamp_washer', type: 'boolean' },
            cooled_glovebox: { category: 'comfort_convenience', key: 'cooled_glovebox', type: 'boolean' },
            'cooled glovebox': { category: 'comfort_convenience', key: 'cooled_glovebox', type: 'boolean' },
            paddle_shifters: { category: 'comfort_convenience', key: 'paddle_shifters', type: 'boolean' },
            'paddle shifters': { category: 'comfort_convenience', key: 'paddle_shifters', type: 'boolean' },
            // Tyres & Wheels
            tyre_size: { category: 'tyres_wheels', key: 'tyre_size', type: 'string' },
            wheel_size: { category: 'tyres_wheels', key: 'wheel_size', type: 'string' },
            'tyre size': { category: 'tyres_wheels', key: 'tyre_size', type: 'string' },
            'wheel size': { category: 'tyres_wheels', key: 'wheel_size', type: 'string' },
            tyre_type: { category: 'tyres_wheels', key: 'tyre_type', type: 'string' },
            'tyre type': { category: 'tyres_wheels', key: 'tyre_type', type: 'string' },
            alloy_wheels: { category: 'tyres_wheels', key: 'alloy_wheels', type: 'boolean' },
            'alloy wheels': { category: 'tyres_wheels', key: 'alloy_wheels', type: 'boolean' },
            spare_tyre: { category: 'tyres_wheels', key: 'spare_tyre', type: 'string' },
            'spare tyre': { category: 'tyres_wheels', key: 'spare_tyre', type: 'string' },
            'spare tire': { category: 'tyres_wheels', key: 'spare_tyre', type: 'string' },
            // Suspension / Steering / Brakes
            front_suspension: { category: 'suspension_steering_brakes', key: 'front_suspension', type: 'string' },
            'front suspension': { category: 'suspension_steering_brakes', key: 'front_suspension', type: 'string' },
            rear_suspension: { category: 'suspension_steering_brakes', key: 'rear_suspension', type: 'string' },
            'rear suspension': { category: 'suspension_steering_brakes', key: 'rear_suspension', type: 'string' },
            steering_type: { category: 'suspension_steering_brakes', key: 'steering_type', type: 'string' },
            'steering type': { category: 'suspension_steering_brakes', key: 'steering_type', type: 'string' },
            'power steering': { category: 'suspension_steering_brakes', key: 'steering_type', type: 'string' },
            steering_adjustment: { category: 'suspension_steering_brakes', key: 'steering_adjustment', type: 'string' },
            'steering adjustment': { category: 'suspension_steering_brakes', key: 'steering_adjustment', type: 'string' },
            steering_column: { category: 'suspension_steering_brakes', key: 'steering_column', type: 'string' },
            'steering column': { category: 'suspension_steering_brakes', key: 'steering_column', type: 'string' },
            front_brake_type: { category: 'suspension_steering_brakes', key: 'front_brake_type', type: 'string' },
            'front brake type': { category: 'suspension_steering_brakes', key: 'front_brake_type', type: 'string' },
            'front brakes': { category: 'suspension_steering_brakes', key: 'front_brake_type', type: 'string' },
            rear_brake_type: { category: 'suspension_steering_brakes', key: 'rear_brake_type', type: 'string' },
            'rear brake type': { category: 'suspension_steering_brakes', key: 'rear_brake_type', type: 'string' },
            'rear brakes': { category: 'suspension_steering_brakes', key: 'rear_brake_type', type: 'string' },
            parking_brake: { category: 'suspension_steering_brakes', key: 'parking_brake', type: 'string' },
            'parking brake': { category: 'suspension_steering_brakes', key: 'parking_brake', type: 'string' },
            'hand brake': { category: 'suspension_steering_brakes', key: 'parking_brake', type: 'string' },
            // ADAS
            adaptive_cruise_control: { category: 'adas', key: 'adaptive_cruise_control', type: 'boolean' },
            'adaptive cruise control': { category: 'adas', key: 'adaptive_cruise_control', type: 'boolean' },
            lane_keep_assist: { category: 'adas', key: 'lane_keep_assist', type: 'boolean' },
            'lane keep assist': { category: 'adas', key: 'lane_keep_assist', type: 'boolean' },
            lane_departure_warning: { category: 'adas', key: 'lane_departure_warning', type: 'boolean' },
            'lane departure warning': { category: 'adas', key: 'lane_departure_warning', type: 'boolean' },
            blind_spot_monitoring: { category: 'adas', key: 'blind_spot_monitoring', type: 'boolean' },
            'blind spot monitoring': { category: 'adas', key: 'blind_spot_monitoring', type: 'boolean' },
            'blind spot detection': { category: 'adas', key: 'blind_spot_monitoring', type: 'boolean' },
            forward_collision_warning: { category: 'adas', key: 'forward_collision_warning', type: 'boolean' },
            'forward collision warning': { category: 'adas', key: 'forward_collision_warning', type: 'boolean' },
            automatic_emergency_braking: { category: 'adas', key: 'automatic_emergency_braking', type: 'boolean' },
            'automatic emergency braking': { category: 'adas', key: 'automatic_emergency_braking', type: 'boolean' },
            'autonomous emergency braking': { category: 'adas', key: 'automatic_emergency_braking', type: 'boolean' },
            traffic_sign_recognition: { category: 'adas', key: 'traffic_sign_recognition', type: 'boolean' },
            'traffic sign recognition': { category: 'adas', key: 'traffic_sign_recognition', type: 'boolean' },
            rear_cross_traffic_alert: { category: 'adas', key: 'rear_cross_traffic_alert', type: 'boolean' },
            'rear cross traffic alert': { category: 'adas', key: 'rear_cross_traffic_alert', type: 'boolean' },
            driver_attention_warning: { category: 'adas', key: 'driver_attention_warning', type: 'boolean' },
            'driver attention warning': { category: 'adas', key: 'driver_attention_warning', type: 'boolean' },
            'driver drowsiness detection': { category: 'adas', key: 'driver_attention_warning', type: 'boolean' },
            adaptive_high_beam_assist: { category: 'adas', key: 'adaptive_high_beam_assist', type: 'boolean' },
            'adaptive high beam assist': { category: 'adas', key: 'adaptive_high_beam_assist', type: 'boolean' },
            safe_exit_warning: { category: 'adas', key: 'safe_exit_warning', type: 'boolean' },
            'safe exit warning': { category: 'adas', key: 'safe_exit_warning', type: 'boolean' },
            // Safety (additional)
            abs: { category: 'safety', key: 'abs', type: 'boolean' },
            ebd: { category: 'safety', key: 'ebd', type: 'boolean' },
            brake_assist: { category: 'safety', key: 'brake_assist', type: 'boolean' },
            'brake assist': { category: 'safety', key: 'brake_assist', type: 'boolean' },
            esp: { category: 'safety', key: 'esp', type: 'boolean' },
            'electronic stability control': { category: 'safety', key: 'esp', type: 'boolean' },
            traction_control: { category: 'safety', key: 'traction_control', type: 'boolean' },
            'traction control': { category: 'safety', key: 'traction_control', type: 'boolean' },
            hill_hold: { category: 'safety', key: 'hill_hold', type: 'boolean' },
            'hill hold': { category: 'safety', key: 'hill_hold', type: 'boolean' },
            'hill assist': { category: 'safety', key: 'hill_hold', type: 'boolean' },
            hill_descent: { category: 'safety', key: 'hill_descent', type: 'boolean' },
            'hill descent': { category: 'safety', key: 'hill_descent', type: 'boolean' },
            rear_camera: { category: 'safety', key: 'rear_camera', type: 'boolean' },
            'rear camera': { category: 'safety', key: 'rear_camera', type: 'boolean' },
            'reverse camera': { category: 'safety', key: 'rear_camera', type: 'boolean' },
            camera_360: { category: 'safety', key: 'camera_360', type: 'boolean' },
            '360 camera': { category: 'safety', key: 'camera_360', type: 'boolean' },
            '360 degree camera': { category: 'safety', key: 'camera_360', type: 'boolean' },
            tpms: { category: 'safety', key: 'tpms', type: 'boolean' },
            'tyre pressure monitoring': { category: 'safety', key: 'tpms', type: 'boolean' },
            isofix: { category: 'safety', key: 'isofix', type: 'boolean' },
            seat_belt_warning: { category: 'safety', key: 'seat_belt_warning', type: 'boolean' },
            'seat belt warning': { category: 'safety', key: 'seat_belt_warning', type: 'boolean' },
            speed_alert: { category: 'safety', key: 'speed_alert', type: 'boolean' },
            'speed alert': { category: 'safety', key: 'speed_alert', type: 'boolean' },
            crash_sensor: { category: 'safety', key: 'crash_sensor', type: 'boolean' },
            'crash sensor': { category: 'safety', key: 'crash_sensor', type: 'boolean' },
            engine_immobilizer: { category: 'safety', key: 'engine_immobilizer', type: 'boolean' },
            'engine immobilizer': { category: 'safety', key: 'engine_immobilizer', type: 'boolean' },
            central_locking: { category: 'safety', key: 'central_locking', type: 'boolean' },
            'central locking': { category: 'safety', key: 'central_locking', type: 'boolean' },
            child_safety_lock: { category: 'safety', key: 'child_safety_lock', type: 'boolean' },
            'child safety lock': { category: 'safety', key: 'child_safety_lock', type: 'boolean' },
            parking_sensors: { category: 'safety', key: 'parking_sensors', type: 'string' },
            'parking sensors': { category: 'safety', key: 'parking_sensors', type: 'string' },
            bncap_rating: { category: 'safety', key: 'bncap_rating', type: 'number' },
            'bharat ncap rating': { category: 'safety', key: 'bncap_rating', type: 'number' },
            'bncap': { category: 'safety', key: 'bncap_rating', type: 'number' },
            // Infotainment & Connectivity
            touchscreen: { category: 'infotainment_connectivity', key: 'touchscreen', type: 'string' },
            android_auto: { category: 'infotainment_connectivity', key: 'android_auto', type: 'boolean' },
            'android auto': { category: 'infotainment_connectivity', key: 'android_auto', type: 'boolean' },
            apple_carplay: { category: 'infotainment_connectivity', key: 'apple_carplay', type: 'boolean' },
            'apple carplay': { category: 'infotainment_connectivity', key: 'apple_carplay', type: 'boolean' },
            carplay: { category: 'infotainment_connectivity', key: 'apple_carplay', type: 'boolean' },
            bluetooth: { category: 'infotainment_connectivity', key: 'bluetooth', type: 'boolean' },
            usb_ports: { category: 'infotainment_connectivity', key: 'usb_ports', type: 'number' },
            'usb ports': { category: 'infotainment_connectivity', key: 'usb_ports', type: 'number' },
            'number of usb ports': { category: 'infotainment_connectivity', key: 'usb_ports', type: 'number' },
            navigation: { category: 'infotainment_connectivity', key: 'navigation', type: 'boolean' },
            'gps navigation': { category: 'infotainment_connectivity', key: 'navigation', type: 'boolean' },
            voice_command: { category: 'infotainment_connectivity', key: 'voice_command', type: 'boolean' },
            'voice command': { category: 'infotainment_connectivity', key: 'voice_command', type: 'boolean' },
            speakers: { category: 'infotainment_connectivity', key: 'speakers', type: 'number' },
            'number of speakers': { category: 'infotainment_connectivity', key: 'speakers', type: 'number' },
            wifi_hotspot: { category: 'infotainment_connectivity', key: 'wifi_hotspot', type: 'boolean' },
            'wifi hotspot': { category: 'infotainment_connectivity', key: 'wifi_hotspot', type: 'boolean' },
            internet_connectivity: { category: 'infotainment_connectivity', key: 'internet_connectivity', type: 'boolean' },
            'internet connectivity': { category: 'infotainment_connectivity', key: 'internet_connectivity', type: 'boolean' },
            ota_updates: { category: 'infotainment_connectivity', key: 'ota_updates', type: 'boolean' },
            'ota updates': { category: 'infotainment_connectivity', key: 'ota_updates', type: 'boolean' },
            // Connected Car
            connected_car_tech: { category: 'connected_car', key: 'connected_car_tech', type: 'string' },
            'connected car': { category: 'connected_car', key: 'connected_car_tech', type: 'string' },
            'connected car technology': { category: 'connected_car', key: 'connected_car_tech', type: 'string' },
            app_connectivity: { category: 'connected_car', key: 'app_connectivity', type: 'boolean' },
            'app connectivity': { category: 'connected_car', key: 'app_connectivity', type: 'boolean' },
            vehicle_tracking: { category: 'connected_car', key: 'vehicle_tracking', type: 'boolean' },
            'vehicle tracking': { category: 'connected_car', key: 'vehicle_tracking', type: 'boolean' },
            geofencing: { category: 'connected_car', key: 'geofencing', type: 'boolean' },
            'geo fencing': { category: 'connected_car', key: 'geofencing', type: 'boolean' },
            live_location: { category: 'connected_car', key: 'live_location', type: 'boolean' },
            'live location': { category: 'connected_car', key: 'live_location', type: 'boolean' },
            remote_engine_start_stop: { category: 'connected_car', key: 'remote_engine_start_stop', type: 'boolean' },
            'remote engine start': { category: 'connected_car', key: 'remote_engine_start_stop', type: 'boolean' },
            remote_lock: { category: 'connected_car', key: 'remote_lock', type: 'boolean' },
            'remote lock': { category: 'connected_car', key: 'remote_lock', type: 'boolean' },
            remote_ac: { category: 'connected_car', key: 'remote_ac', type: 'boolean' },
            'remote ac': { category: 'connected_car', key: 'remote_ac', type: 'boolean' },
            remote_sunroof: { category: 'connected_car', key: 'remote_sunroof', type: 'boolean' },
            find_my_car: { category: 'connected_car', key: 'find_my_car', type: 'boolean' },
            'find my car': { category: 'connected_car', key: 'find_my_car', type: 'boolean' },
            sos_emergency_assist: { category: 'connected_car', key: 'sos_emergency_assist', type: 'boolean' },
            'sos': { category: 'connected_car', key: 'sos_emergency_assist', type: 'boolean' },
            'emergency sos': { category: 'connected_car', key: 'sos_emergency_assist', type: 'boolean' },
            digital_key: { category: 'connected_car', key: 'digital_key', type: 'boolean' },
            'digital key': { category: 'connected_car', key: 'digital_key', type: 'boolean' },
            emergency_sos_button: { category: 'connected_car', key: 'emergency_sos_button', type: 'boolean' },
            'sos button': { category: 'connected_car', key: 'emergency_sos_button', type: 'boolean' },
            // Interior
            dashboard_type: { category: 'interior', key: 'dashboard_type', type: 'string' },
            'dashboard type': { category: 'interior', key: 'dashboard_type', type: 'string' },
            instrument_cluster: { category: 'interior', key: 'instrument_cluster', type: 'string' },
            'instrument cluster': { category: 'interior', key: 'instrument_cluster', type: 'string' },
            digital_driver_display: { category: 'interior', key: 'digital_driver_display', type: 'boolean' },
            'digital driver display': { category: 'interior', key: 'digital_driver_display', type: 'boolean' },
            interior_theme: { category: 'interior', key: 'interior_theme', type: 'string' },
            'interior theme': { category: 'interior', key: 'interior_theme', type: 'string' },
            interior_color: { category: 'interior', key: 'interior_color', type: 'string' },
            'interior color': { category: 'interior', key: 'interior_color', type: 'string' },
            dashboard_material: { category: 'interior', key: 'dashboard_material', type: 'string' },
            'dashboard material': { category: 'interior', key: 'dashboard_material', type: 'string' },
            soft_touch_dashboard: { category: 'interior', key: 'soft_touch_dashboard', type: 'boolean' },
            'soft touch dashboard': { category: 'interior', key: 'soft_touch_dashboard', type: 'boolean' },
            ambient_lighting: { category: 'interior', key: 'ambient_lighting', type: 'boolean' },
            'ambient lighting': { category: 'interior', key: 'ambient_lighting', type: 'boolean' },
            multi_color_ambient_lighting: { category: 'interior', key: 'multi_color_ambient_lighting', type: 'boolean' },
            'multi color ambient lighting': { category: 'interior', key: 'multi_color_ambient_lighting', type: 'boolean' },
            leather_wrapped_steering: { category: 'interior', key: 'leather_wrapped_steering', type: 'boolean' },
            'leather steering': { category: 'interior', key: 'leather_wrapped_steering', type: 'boolean' },
            'leather wrapped steering': { category: 'interior', key: 'leather_wrapped_steering', type: 'boolean' },
            leather_wrapped_gear_knob: { category: 'interior', key: 'leather_wrapped_gear_knob', type: 'boolean' },
            'leather gear knob': { category: 'interior', key: 'leather_wrapped_gear_knob', type: 'boolean' },
            panoramic_sunroof_interior: { category: 'interior', key: 'panoramic_sunroof', type: 'boolean' },
            'sunroof type': { category: 'interior', key: 'sunroof', type: 'string' },
            moonroof: { category: 'interior', key: 'moonroof', type: 'boolean' },
            rear_sunblind: { category: 'interior', key: 'rear_sunblind', type: 'boolean' },
            'rear sunblind': { category: 'interior', key: 'rear_sunblind', type: 'boolean' },
            interior_material: { category: 'interior', key: 'interior_material', type: 'string' },
            'interior material': { category: 'interior', key: 'interior_material', type: 'string' },
            // Exterior
            headlight_type: { category: 'exterior', key: 'headlight_type', type: 'string' },
            'headlight type': { category: 'exterior', key: 'headlight_type', type: 'string' },
            'headlamp type': { category: 'exterior', key: 'headlight_type', type: 'string' },
            led_headlights: { category: 'exterior', key: 'led_headlights', type: 'boolean' },
            'led headlights': { category: 'exterior', key: 'led_headlights', type: 'boolean' },
            led_tail_lights: { category: 'exterior', key: 'led_tail_lights', type: 'boolean' },
            'led tail lights': { category: 'exterior', key: 'led_tail_lights', type: 'boolean' },
            'led taillights': { category: 'exterior', key: 'led_tail_lights', type: 'boolean' },
            drl: { category: 'exterior', key: 'drl', type: 'boolean' },
            'daytime running lights': { category: 'exterior', key: 'drl', type: 'boolean' },
            fog_lights: { category: 'exterior', key: 'fog_lights', type: 'string' },
            'fog lights': { category: 'exterior', key: 'fog_lights', type: 'string' },
            automatic_headlamps: { category: 'exterior', key: 'automatic_headlamps', type: 'boolean' },
            'automatic headlamps': { category: 'exterior', key: 'automatic_headlamps', type: 'boolean' },
            'auto headlamps': { category: 'exterior', key: 'automatic_headlamps', type: 'boolean' },
            follow_me_home: { category: 'exterior', key: 'follow_me_home', type: 'boolean' },
            'follow me home': { category: 'exterior', key: 'follow_me_home', type: 'boolean' },
            roof_rails: { category: 'exterior', key: 'roof_rails', type: 'boolean' },
            'roof rails': { category: 'exterior', key: 'roof_rails', type: 'boolean' },
            body_color: { category: 'exterior', key: 'body_color', type: 'string' },
            'body color': { category: 'exterior', key: 'body_color', type: 'string' },
            spoiler: { category: 'exterior', key: 'spoiler', type: 'boolean' },
            'rear spoiler': { category: 'exterior', key: 'spoiler', type: 'boolean' },
            skid_plate: { category: 'exterior', key: 'skid_plate', type: 'boolean' },
            'skid plate': { category: 'exterior', key: 'skid_plate', type: 'boolean' },
            alloy_wheels_design: { category: 'exterior', key: 'alloy_wheels_design', type: 'string' },
            'alloy wheel design': { category: 'exterior', key: 'alloy_wheels_design', type: 'string' },
            orvm_type: { category: 'exterior', key: 'orvm_type', type: 'string' },
            'orvm type': { category: 'exterior', key: 'orvm_type', type: 'string' },
            orvm_indicators: { category: 'exterior', key: 'orvm_indicators', type: 'boolean' },
            'orvm indicators': { category: 'exterior', key: 'orvm_indicators', type: 'boolean' },
            rear_wiper_ext: { category: 'exterior', key: 'rear_wiper', type: 'boolean' },
            rear_defogger: { category: 'exterior', key: 'rear_defogger', type: 'boolean' },
            'rear defogger': { category: 'exterior', key: 'rear_defogger', type: 'boolean' },
            connected_led_taillight: { category: 'exterior', key: 'connected_led_taillight', type: 'boolean' },
            'connected led taillight': { category: 'exterior', key: 'connected_led_taillight', type: 'boolean' },
            flush_door_handles: { category: 'exterior', key: 'flush_door_handles', type: 'boolean' },
            'flush door handles': { category: 'exterior', key: 'flush_door_handles', type: 'boolean' },
            rain_sensing_wipers: { category: 'exterior', key: 'rain_sensing_wipers', type: 'boolean' },
            'rain sensing wipers': { category: 'exterior', key: 'rain_sensing_wipers', type: 'boolean' },
            // Storage & Cabin Practicality
            cupholders_front: { category: 'storage_cabin_practicality', key: 'cupholders_front', type: 'number' },
            'front cupholders': { category: 'storage_cabin_practicality', key: 'cupholders_front', type: 'number' },
            cupholders_rear: { category: 'storage_cabin_practicality', key: 'cupholders_rear', type: 'number' },
            'rear cupholders': { category: 'storage_cabin_practicality', key: 'cupholders_rear', type: 'number' },
            bottle_holders: { category: 'storage_cabin_practicality', key: 'bottle_holders', type: 'number' },
            'bottle holders': { category: 'storage_cabin_practicality', key: 'bottle_holders', type: 'number' },
            door_pockets: { category: 'storage_cabin_practicality', key: 'door_pockets', type: 'boolean' },
            'door pockets': { category: 'storage_cabin_practicality', key: 'door_pockets', type: 'boolean' },
            front_seatback_pockets: { category: 'storage_cabin_practicality', key: 'front_seatback_pockets', type: 'boolean' },
            'seatback pockets': { category: 'storage_cabin_practicality', key: 'front_seatback_pockets', type: 'boolean' },
            driver_armrest_storage: { category: 'storage_cabin_practicality', key: 'driver_armrest_storage', type: 'boolean' },
            'armrest storage': { category: 'storage_cabin_practicality', key: 'driver_armrest_storage', type: 'boolean' },
            rear_armrest: { category: 'storage_cabin_practicality', key: 'rear_armrest', type: 'boolean' },
            'rear armrest': { category: 'storage_cabin_practicality', key: 'rear_armrest', type: 'boolean' },
            cabin_boot_access: { category: 'storage_cabin_practicality', key: 'cabin_boot_access', type: 'boolean' },
            sunglass_holder: { category: 'storage_cabin_practicality', key: 'sunglass_holder', type: 'boolean' },
            'sunglass holder': { category: 'storage_cabin_practicality', key: 'sunglass_holder', type: 'boolean' },
            // Driver Display & Controls
            heads_up_display: { category: 'driver_display_controls', key: 'heads_up_display', type: 'boolean' },
            'heads up display': { category: 'driver_display_controls', key: 'heads_up_display', type: 'boolean' },
            'hud': { category: 'driver_display_controls', key: 'heads_up_display', type: 'boolean' },
            gear_indicator: { category: 'driver_display_controls', key: 'gear_indicator', type: 'boolean' },
            'gear indicator': { category: 'driver_display_controls', key: 'gear_indicator', type: 'boolean' },
            distance_to_empty: { category: 'driver_display_controls', key: 'distance_to_empty', type: 'boolean' },
            'distance to empty': { category: 'driver_display_controls', key: 'distance_to_empty', type: 'boolean' },
            driving_efficiency_display: { category: 'driver_display_controls', key: 'driving_efficiency_display', type: 'boolean' },
            'driving efficiency display': { category: 'driver_display_controls', key: 'driving_efficiency_display', type: 'boolean' },
            // Warranty
            basic_warranty_years: { category: 'warranty', key: 'basic_warranty_years', type: 'number' },
            'warranty years': { category: 'warranty', key: 'basic_warranty_years', type: 'number' },
            basic_warranty_km: { category: 'warranty', key: 'basic_warranty_km', type: 'number' },
            'warranty km': { category: 'warranty', key: 'basic_warranty_km', type: 'number' },
            battery_warranty_years: { category: 'warranty', key: 'battery_warranty_years', type: 'number' },
            'battery warranty years': { category: 'warranty', key: 'battery_warranty_years', type: 'number' },
            battery_warranty_km: { category: 'warranty', key: 'battery_warranty_km', type: 'number' },
            'battery warranty km': { category: 'warranty', key: 'battery_warranty_km', type: 'number' },
            // Dimensions (additional)
            boot_space_folded: { category: 'dimensions_practicality', key: 'boot_space_folded', type: 'string' },
            'boot space folded': { category: 'dimensions_practicality', key: 'boot_space_folded', type: 'string' },
            'boot space with seats folded': { category: 'dimensions_practicality', key: 'boot_space_folded', type: 'string' },
            frunk_space: { category: 'dimensions_practicality', key: 'frunk_space', type: 'string' },
            'frunk space': { category: 'dimensions_practicality', key: 'frunk_space', type: 'string' },
            doors: { category: 'dimensions_practicality', key: 'doors', type: 'number' },
            'number of doors': { category: 'dimensions_practicality', key: 'doors', type: 'number' },
            kerb_weight: { category: 'dimensions_practicality', key: 'kerb_weight', type: 'string' },
            'kerb weight': { category: 'dimensions_practicality', key: 'kerb_weight', type: 'string' },
            'curb weight': { category: 'dimensions_practicality', key: 'kerb_weight', type: 'string' },
            gross_vehicle_weight: { category: 'dimensions_practicality', key: 'gross_vehicle_weight', type: 'string' },
            'gross vehicle weight': { category: 'dimensions_practicality', key: 'gross_vehicle_weight', type: 'string' },
            'gvw': { category: 'dimensions_practicality', key: 'gross_vehicle_weight', type: 'string' },
            number_of_rows: { category: 'dimensions_practicality', key: 'number_of_rows', type: 'number' },
            'number of rows': { category: 'dimensions_practicality', key: 'number_of_rows', type: 'number' },
            'rows of seats': { category: 'dimensions_practicality', key: 'number_of_rows', type: 'number' },
            length: { category: 'dimensions_practicality', key: 'length', type: 'string' },
            width: { category: 'dimensions_practicality', key: 'width', type: 'string' },
            height: { category: 'dimensions_practicality', key: 'height', type: 'string' },
            wheelbase: { category: 'dimensions_practicality', key: 'wheelbase', type: 'string' },
            // Engine & Performance (additional)
            fuel_system: { category: 'engine_performance', key: 'fuel_system', type: 'string' },
            'fuel system': { category: 'engine_performance', key: 'fuel_system', type: 'string' },
            'fuel supply': { category: 'engine_performance', key: 'fuel_system', type: 'string' },
            idle_start_stop: { category: 'engine_performance', key: 'idle_start_stop', type: 'boolean' },
            'idle start stop': { category: 'engine_performance', key: 'idle_start_stop', type: 'boolean' },
            'start stop': { category: 'engine_performance', key: 'idle_start_stop', type: 'boolean' },
            acceleration_0_100: { category: 'engine_performance', key: 'acceleration_0_100', type: 'string' },
            '0 100 kmph': { category: 'engine_performance', key: 'acceleration_0_100', type: 'string' },
            'acceleration 0 100': { category: 'engine_performance', key: 'acceleration_0_100', type: 'string' },
            top_speed: { category: 'engine_performance', key: 'top_speed', type: 'string' },
            'top speed': { category: 'engine_performance', key: 'top_speed', type: 'string' },
            gearbox: { category: 'engine_performance', key: 'gearbox', type: 'string' },
            engine_type: { category: 'engine_performance', key: 'engine_type', type: 'string' },
            'engine type': { category: 'engine_performance', key: 'engine_type', type: 'string' },
            alternate_fuel_type: { category: 'engine_performance', key: 'alternate_fuel_type', type: 'string' },
            'alternate fuel type': { category: 'engine_performance', key: 'alternate_fuel_type', type: 'string' },
            'secondary fuel type': { category: 'engine_performance', key: 'alternate_fuel_type', type: 'string' },
            electric_assist: { category: 'engine_performance', key: 'electric_assist', type: 'string' },
            'electric assist': { category: 'engine_performance', key: 'electric_assist', type: 'string' },
            // Battery & Charging (additional)
            motor_power_bhp: { category: 'battery_charging', key: 'motor_power_bhp', type: 'string' },
            'motor power bhp': { category: 'battery_charging', key: 'motor_power_bhp', type: 'string' },
            'motor torque': { category: 'battery_charging', key: 'motor_torque_nm', type: 'string' },
            number_of_motors: { category: 'battery_charging', key: 'number_of_motors', type: 'number' },
            'number of motors': { category: 'battery_charging', key: 'number_of_motors', type: 'number' },
            ev_mode_available: { category: 'battery_charging', key: 'ev_mode_available', type: 'boolean' },
            'ev mode available': { category: 'battery_charging', key: 'ev_mode_available', type: 'boolean' },
            'ev mode': { category: 'battery_charging', key: 'ev_mode', type: 'string' },
            drivetrain_ev: { category: 'battery_charging', key: 'drivetrain_ev', type: 'string' },
            'ev drivetrain': { category: 'battery_charging', key: 'drivetrain_ev', type: 'string' },
            regenerative_braking: { category: 'battery_charging', key: 'regenerative_braking', type: 'boolean' },
            'regenerative braking': { category: 'battery_charging', key: 'regenerative_braking', type: 'boolean' },
            vehicle_to_load: { category: 'battery_charging', key: 'vehicle_to_load', type: 'boolean' },
            'vehicle to load': { category: 'battery_charging', key: 'vehicle_to_load', type: 'boolean' },
            'v2l': { category: 'battery_charging', key: 'vehicle_to_load', type: 'boolean' },
            vehicle_to_vehicle: { category: 'battery_charging', key: 'vehicle_to_vehicle', type: 'boolean' },
            'v2v': { category: 'battery_charging', key: 'vehicle_to_vehicle', type: 'boolean' },
            electric_range: { category: 'battery_charging', key: 'electric_range', type: 'string' },
            'electric range': { category: 'battery_charging', key: 'electric_range', type: 'string' },
            'range': { category: 'battery_charging', key: 'electric_range', type: 'string' },
            real_world_range: { category: 'battery_charging', key: 'real_world_range', type: 'number' },
            'real world range': { category: 'battery_charging', key: 'real_world_range', type: 'number' },
            battery_wltp_km: { category: 'battery_charging', key: 'battery_wltp_km', type: 'number' },
            'wltp range': { category: 'battery_charging', key: 'battery_wltp_km', type: 'number' },
            ac_charging_time: { category: 'battery_charging', key: 'ac_charging_time', type: 'string' },
            'ac charging time': { category: 'battery_charging', key: 'ac_charging_time', type: 'string' },
            dc_fast_charging_time: { category: 'battery_charging', key: 'dc_fast_charging_time', type: 'string' },
            'dc charging time': { category: 'battery_charging', key: 'dc_fast_charging_time', type: 'string' },
            fast_charge_0_80: { category: 'battery_charging', key: 'fast_charge_0_80', type: 'string' },
            '0 80 percent charging': { category: 'battery_charging', key: 'fast_charge_0_80', type: 'string' },
            max_ac_charging_speed_kw: { category: 'battery_charging', key: 'max_ac_charging_speed_kw', type: 'number' },
            'max ac charging speed': { category: 'battery_charging', key: 'max_ac_charging_speed_kw', type: 'number' },
            max_dc_charging_speed_kw: { category: 'battery_charging', key: 'max_dc_charging_speed_kw', type: 'number' },
            'max dc charging speed': { category: 'battery_charging', key: 'max_dc_charging_speed_kw', type: 'number' },
            battery_chemistry: { category: 'battery_charging', key: 'battery_chemistry', type: 'string' },
            'battery chemistry': { category: 'battery_charging', key: 'battery_chemistry', type: 'string' },
            battery_type: { category: 'battery_charging', key: 'battery_type', type: 'string' },
            'battery type': { category: 'battery_charging', key: 'battery_type', type: 'string' },
            charging_port_type: { category: 'battery_charging', key: 'charging_port_type', type: 'string' },
            'charging port': { category: 'battery_charging', key: 'charging_port_type', type: 'string' },
            // Mileage / Range (additional)
            emission_standard: { category: 'mileage_range', key: 'emission_standard', type: 'string' },
            'emission standard': { category: 'mileage_range', key: 'emission_standard', type: 'string' },
            'bs6': { category: 'mileage_range', key: 'emission_standard', type: 'string' },
            highway_mileage: { category: 'mileage_range', key: 'highway_mileage', type: 'string' },
            'highway mileage': { category: 'mileage_range', key: 'highway_mileage', type: 'string' },
            real_mileage: { category: 'mileage_range', key: 'real_mileage', type: 'string' },
            'real mileage': { category: 'mileage_range', key: 'real_mileage', type: 'string' },
            'real world mileage': { category: 'mileage_range', key: 'real_mileage', type: 'string' },
            cng_mileage: { category: 'mileage_range', key: 'cng_mileage', type: 'string' },
            'cng mileage': { category: 'mileage_range', key: 'cng_mileage', type: 'string' },
            cng_tank_capacity: { category: 'mileage_range', key: 'cng_tank_capacity', type: 'string' },
            'cng tank capacity': { category: 'mileage_range', key: 'cng_tank_capacity', type: 'string' },
        };
        return mappings[normalized] || null;
    }
    /**
     * Normalize a value based on its expected type
     */
    static normalizeValueForType(value, type) {
        if (type === 'boolean') {
            const result = boolean_normalizer_1.BooleanNormalizer.normalize(value);
            return {
                value: result.value,
                confidence: result.confidence,
                is_estimated: result.is_estimated,
            };
        }
        if (type === 'number') {
            const numeric = string_normalizer_1.StringNormalizer.extractNumeric(value);
            if (numeric !== null) {
                return {
                    value: numeric,
                    confidence: 1,
                    is_estimated: false,
                };
            }
            return {
                value: null,
                confidence: 0,
                is_estimated: false,
            };
        }
        if (type === 'string') {
            const result = string_normalizer_1.StringNormalizer.normalize(value);
            return {
                value: result.is_valid ? result.value : null,
                confidence: result.confidence,
                is_estimated: result.changes_made.length > 1,
            };
        }
        return {
            value: value,
            confidence: 0.5,
            is_estimated: false,
        };
    }
}
exports.ImportNormalizerService = ImportNormalizerService;
//# sourceMappingURL=import-normalizer.service.js.map