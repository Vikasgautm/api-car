"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INVALID_LABELS = exports.SPEC_LABEL_MAP = void 0;
exports.normalizeLabel = normalizeLabel;
exports.isInvalidLabel = isInvalidLabel;
exports.getSpecMapping = getSpecMapping;
exports.parseSpecValue = parseSpecValue;
exports.guessCategory = guessCategory;
exports.SPEC_LABEL_MAP = {
    // ========== ENGINE & PERFORMANCE ==========
    'engine type': {
        category: 'engine_performance',
        key: 'engine_type',
        path: 'specs_normalized.engine_performance.engine_type',
        type: 'string',
    },
    'displacement': {
        category: 'engine_performance',
        key: 'displacement',
        path: 'specs_normalized.engine_performance.displacement',
        type: 'string',
    },
    'max power': {
        category: 'engine_performance',
        key: 'max_power',
        path: 'specs_normalized.engine_performance.max_power',
        type: 'string',
    },
    'max torque': {
        category: 'engine_performance',
        key: 'max_torque',
        path: 'specs_normalized.engine_performance.max_torque',
        type: 'string',
    },
    'no of cylinders': {
        category: 'engine_performance',
        key: 'cylinders',
        path: 'specs_normalized.engine_performance.cylinders',
        type: 'number',
    },
    'number of cylinders': {
        category: 'engine_performance',
        key: 'cylinders',
        path: 'specs_normalized.engine_performance.cylinders',
        type: 'number',
    },
    'valves per cylinder': {
        category: 'engine_performance',
        key: 'valves_per_cylinder',
        path: 'specs_normalized.engine_performance.valves_per_cylinder',
        type: 'number',
    },
    'fuel supply system': {
        category: 'engine_performance',
        key: 'fuel_system',
        path: 'specs_normalized.engine_performance.fuel_system',
        type: 'string',
    },
    'turbo charger': {
        category: 'engine_performance',
        key: 'turbocharger',
        path: 'specs_normalized.engine_performance.turbocharger',
        type: 'boolean',
    },
    'turbocharger': {
        category: 'engine_performance',
        key: 'turbocharger',
        path: 'specs_normalized.engine_performance.turbocharger',
        type: 'boolean',
    },
    'transmission type': {
        category: 'engine_performance',
        key: 'transmission_type',
        rootKey: 'transmission_type',
        type: 'transmission',
    },
    'gearbox': {
        category: 'engine_performance',
        key: 'gearbox',
        path: 'specs_raw.gearbox',
        type: 'string',
    },
    'drive type': {
        category: 'engine_performance',
        key: 'drivetrain',
        rootKey: 'drivetrain',
        type: 'string',
    },
    'fuel type': {
        category: 'engine_performance',
        key: 'fuel_type',
        rootKey: 'fuel_type',
        type: 'string',
    },
    // ========== MILEAGE & RANGE ==========
    'petrol fuel tank capacity': {
        category: 'mileage_range',
        key: 'fuel_tank_capacity',
        path: 'specs_normalized.mileage_range.fuel_tank_capacity',
        type: 'string',
    },
    'fuel tank capacity': {
        category: 'mileage_range',
        key: 'fuel_tank_capacity',
        path: 'specs_normalized.mileage_range.fuel_tank_capacity',
        type: 'string',
    },
    'emission norm compliance': {
        category: 'mileage_range',
        key: 'emission_standard',
        path: 'specs_normalized.mileage_range.emission_standard',
        type: 'string',
    },
    // ========== BATTERY & CHARGING (EV) ==========
    'battery capacity': {
        category: 'battery_charging',
        key: 'battery_capacity',
        path: 'specs_normalized.battery_charging.battery_capacity',
        type: 'string',
    },
    'range': {
        category: 'battery_charging',
        key: 'electric_range',
        path: 'specs_normalized.battery_charging.electric_range',
        type: 'string',
    },
    'electric range': {
        category: 'battery_charging',
        key: 'electric_range',
        path: 'specs_normalized.battery_charging.electric_range',
        type: 'string',
    },
    'motor type': {
        category: 'battery_charging',
        key: 'motor_type',
        path: 'specs_normalized.battery_charging.motor_type',
        type: 'string',
    },
    'charging time': {
        category: 'battery_charging',
        key: 'charging_time',
        path: 'specs_normalized.battery_charging.charging_time',
        type: 'string',
    },
    'charging options': {
        category: 'battery_charging',
        key: 'charging_options',
        path: 'specs_normalized.battery_charging.charging_options',
        type: 'array',
    },
    'charging time ac': {
        category: 'battery_charging',
        key: 'charging_time_ac',
        path: 'specs_raw.charging_time_ac',
        type: 'string',
    },
    'charging time dc': {
        category: 'battery_charging',
        key: 'charging_time_dc',
        path: 'specs_raw.charging_time_dc',
        type: 'string',
    },
    'battery type': {
        category: 'battery_charging',
        key: 'battery_type',
        path: 'specs_raw.battery_type',
        type: 'string',
    },
    'motor power': {
        category: 'battery_charging',
        key: 'motor_power',
        path: 'specs_raw.motor_power',
        type: 'string',
    },
    'charging port': {
        category: 'battery_charging',
        key: 'charging_port',
        path: 'specs_raw.charging_port',
        type: 'string',
    },
    'fast charging': {
        category: 'battery_charging',
        key: 'fast_charging',
        path: 'specs_raw.fast_charging',
        type: 'boolean',
    },
    'regenerative braking': {
        category: 'battery_charging',
        key: 'regenerative_braking',
        path: 'specs_raw.regenerative_braking',
        type: 'boolean',
    },
    'regenerative braking levels': {
        category: 'battery_charging',
        key: 'regenerative_braking_levels',
        path: 'specs_raw.regenerative_braking_levels',
        type: 'number',
    },
    'acceleration 0100kmph': {
        category: 'engine_performance',
        key: 'acceleration_0_100_kmph',
        path: 'specs_raw.acceleration_0_100_kmph',
        type: 'string',
    },
    // ========== SUSPENSION, STEERING & BRAKES ==========
    'front suspension': {
        category: 'suspension_steering_brakes',
        key: 'front_suspension',
        path: 'specs_normalized.suspension_steering_brakes.front_suspension',
        type: 'string',
    },
    'rear suspension': {
        category: 'suspension_steering_brakes',
        key: 'rear_suspension',
        path: 'specs_normalized.suspension_steering_brakes.rear_suspension',
        type: 'string',
    },
    'steering type': {
        category: 'suspension_steering_brakes',
        key: 'steering_type',
        path: 'specs_normalized.suspension_steering_brakes.steering_type',
        type: 'string',
    },
    'steering column': {
        category: 'suspension_steering_brakes',
        key: 'steering_column',
        path: 'specs_normalized.suspension_steering_brakes.steering_column',
        type: 'string',
    },
    'front brake type': {
        category: 'suspension_steering_brakes',
        key: 'front_brake_type',
        path: 'specs_normalized.suspension_steering_brakes.front_brake_type',
        type: 'string',
    },
    'rear brake type': {
        category: 'suspension_steering_brakes',
        key: 'rear_brake_type',
        path: 'specs_normalized.suspension_steering_brakes.rear_brake_type',
        type: 'string',
    },
    'shock absorbers type': {
        category: 'suspension_steering_brakes',
        key: 'shock_absorbers_type',
        path: 'specs_raw.shock_absorbers_type',
        type: 'string',
    },
    'turning radius': {
        category: 'suspension_steering_brakes',
        key: 'turning_radius',
        path: 'specs_raw.turning_radius',
        type: 'string',
    },
    // ========== DIMENSIONS & PRACTICALITY ==========
    'length': {
        category: 'dimensions_practicality',
        key: 'length',
        path: 'specs_normalized.dimensions_practicality.length',
        type: 'string',
    },
    'width': {
        category: 'dimensions_practicality',
        key: 'width',
        path: 'specs_normalized.dimensions_practicality.width',
        type: 'string',
    },
    'height': {
        category: 'dimensions_practicality',
        key: 'height',
        path: 'specs_normalized.dimensions_practicality.height',
        type: 'string',
    },
    'wheel base': {
        category: 'dimensions_practicality',
        key: 'wheelbase',
        path: 'specs_normalized.dimensions_practicality.wheelbase',
        type: 'string',
    },
    'wheelbase': {
        category: 'dimensions_practicality',
        key: 'wheelbase',
        path: 'specs_normalized.dimensions_practicality.wheelbase',
        type: 'string',
    },
    'ground clearance unladen': {
        category: 'dimensions_practicality',
        key: 'ground_clearance',
        path: 'specs_normalized.dimensions_practicality.ground_clearance',
        type: 'string',
    },
    'boot space': {
        category: 'dimensions_practicality',
        key: 'boot_space',
        path: 'specs_normalized.dimensions_practicality.boot_space',
        type: 'string',
    },
    'boot space rear seat folding': {
        category: 'dimensions_practicality',
        key: 'boot_space_rear_seat_folding',
        path: 'specs_raw.boot_space_rear_seat_folding',
        type: 'string',
    },
    'seating capacity': {
        category: 'dimensions_practicality',
        key: 'seating_capacity',
        path: 'specs_normalized.dimensions_practicality.seating_capacity',
        rootKey: 'seating_capacity',
        type: 'number',
    },
    'no of doors': {
        category: 'dimensions_practicality',
        key: 'doors',
        path: 'specs_normalized.dimensions_practicality.doors',
        type: 'number',
    },
    'number of doors': {
        category: 'dimensions_practicality',
        key: 'doors',
        path: 'specs_normalized.dimensions_practicality.doors',
        type: 'number',
    },
    // ========== TYRES & WHEELS ==========
    'tyre size': {
        category: 'tyres_wheels',
        key: 'tyre_size',
        path: 'specs_normalized.tyres_wheels.tyre_size',
        type: 'string',
    },
    'tyre type': {
        category: 'tyres_wheels',
        key: 'tyre_type',
        path: 'specs_normalized.tyres_wheels.tyre_type',
        type: 'string',
    },
    'wheel size': {
        category: 'tyres_wheels',
        key: 'wheel_size',
        path: 'specs_normalized.tyres_wheels.wheel_size',
        type: 'string',
    },
    // ========== SAFETY ==========
    'no of airbags': {
        category: 'safety',
        key: 'airbags',
        path: 'specs_normalized.safety.airbags',
        type: 'number',
    },
    'number of airbags': {
        category: 'safety',
        key: 'airbags',
        path: 'specs_normalized.safety.airbags',
        type: 'number',
    },
    'parking sensors': {
        category: 'safety',
        key: 'parking_sensors',
        path: 'specs_normalized.safety.parking_sensors',
        type: 'string',
    },
    'rear camera': {
        category: 'safety',
        key: 'rear_camera',
        path: 'specs_normalized.safety.rear_camera',
        type: 'boolean',
    },
    'bharat ncap safety rating': {
        category: 'safety',
        key: 'bharat_ncap_safety_rating',
        path: 'specs_raw.bharat_ncap_safety_rating',
        type: 'string',
    },
    'bharat ncap child safety rating': {
        category: 'safety',
        key: 'bharat_ncap_child_safety_rating',
        path: 'specs_raw.bharat_ncap_child_safety_rating',
        type: 'string',
    },
    'pretensioners force limiter seatbelts': {
        category: 'safety',
        key: 'pretensioners_force_limiter_seatbelts',
        path: 'specs_raw.pretensioners_force_limiter_seatbelts',
        type: 'string',
    },
    // ========== COMFORT & CONVENIENCE ==========
    'adjustable steering': {
        category: 'comfort_convenience',
        key: 'steering_adjustment',
        path: 'specs_normalized.comfort_convenience.steering_adjustment',
        type: 'string',
    },
    'foldable rear seat': {
        category: 'comfort_convenience',
        key: 'folding_rear_seats',
        path: 'specs_normalized.comfort_convenience.folding_rear_seats',
        type: 'string',
    },
    'power windows': {
        category: 'comfort_convenience',
        key: 'power_windows',
        path: 'specs_normalized.comfort_convenience.power_windows',
        type: 'string',
    },
    'rear seat headrest': {
        category: 'comfort_convenience',
        key: 'rear_seat_headrest',
        path: 'specs_raw.rear_seat_headrest',
        type: 'string',
    },
    'central console armrest': {
        category: 'comfort_convenience',
        key: 'central_console_armrest',
        path: 'specs_raw.central_console_armrest',
        type: 'string',
    },
    'drive modes': {
        category: 'comfort_convenience',
        key: 'drive_modes',
        path: 'specs_raw.drive_modes',
        type: 'string',
    },
    'drive mode types': {
        category: 'comfort_convenience',
        key: 'drive_mode_types',
        path: 'specs_raw.drive_mode_types',
        type: 'string',
    },
    'cup holders': {
        category: 'comfort_convenience',
        key: 'cup_holders',
        path: 'specs_raw.cup_holders',
        type: 'string',
    },
    // ========== INFOTAINMENT & CONNECTIVITY ==========
    'usb charger': {
        category: 'infotainment_connectivity',
        key: 'usb_ports',
        path: 'specs_raw.usb_charger',
        type: 'string',
    },
    'touchscreen size': {
        category: 'infotainment_connectivity',
        key: 'touchscreen',
        path: 'specs_normalized.infotainment_connectivity.touchscreen',
        type: 'string',
    },
    'no of speakers': {
        category: 'infotainment_connectivity',
        key: 'speakers',
        path: 'specs_normalized.infotainment_connectivity.speakers',
        type: 'number',
    },
    'number of speakers': {
        category: 'infotainment_connectivity',
        key: 'speakers',
        path: 'specs_normalized.infotainment_connectivity.speakers',
        type: 'number',
    },
    'speakers': {
        category: 'infotainment_connectivity',
        key: 'speakers_position',
        path: 'specs_raw.speakers_position',
        type: 'string',
    },
    // ========== INTERIOR ==========
    'upholstery': {
        category: 'interior',
        key: 'interior_material',
        path: 'specs_normalized.interior.interior_material',
        type: 'string',
    },
    // ========== EXTERIOR ==========
    'outside rear view mirror orvm': {
        category: 'exterior',
        key: 'orvm',
        path: 'specs_raw.orvm',
        type: 'string',
    },
    'antenna': {
        category: 'exterior',
        key: 'antenna',
        path: 'specs_raw.antenna',
        type: 'string',
    },
    'boot opening': {
        category: 'exterior',
        key: 'boot_opening',
        path: 'specs_raw.boot_opening',
        type: 'string',
    },
    // ========== ADDITIONAL FEATURES (special handling) ==========
    'additional features': {
        category: 'features',
        key: 'additional_features',
        path: 'specs_raw.additional_features',
        type: 'array',
    },
};
// Invalid labels to filter out
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
            if (lower === 'yes' || lower === 'true' || lower === 'available' || lower === 'with' || lower === 'powered') {
                return true;
            }
            if (lower === 'no' || lower === 'false' || lower === 'not available' || lower === 'none') {
                return false;
            }
            return null;
        }
        case 'array': {
            return trimmed
                .split('|')
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
    // Battery / Charging / EV
    if (lowerLabel.includes('battery') || lowerLabel.includes('charging') ||
        lowerLabel.includes('electric range') || lowerLabel.includes('motor type') ||
        lowerLabel.includes('motor power') || lowerLabel.includes('regenerative') ||
        (lowerLabel.includes('range') && !lowerLabel.includes('price'))) {
        return 'battery_charging';
    }
    // Engine & Performance
    if (lowerLabel.includes('engine') || lowerLabel.includes('displacement') ||
        lowerLabel.includes('cylinder') || lowerLabel.includes('turbo') ||
        lowerLabel.includes('valve') || lowerLabel.includes('fuel system') ||
        lowerLabel.includes('acceleration') || lowerLabel.includes('0-100') ||
        lowerLabel.includes('0100kmph') || lowerLabel.includes('top speed')) {
        return 'engine_performance';
    }
    // Suspension / Steering / Brakes
    if (lowerLabel.includes('suspension') || lowerLabel.includes('steering') ||
        lowerLabel.includes('shock absorber') || lowerLabel.includes('turning radius') ||
        lowerLabel.includes('brake type') || lowerLabel.includes('parking brake')) {
        return 'suspension_steering_brakes';
    }
    // Safety
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
    // Infotainment & Connectivity
    if (lowerLabel.includes('touchscreen') || lowerLabel.includes('speaker') ||
        lowerLabel.includes('android') || lowerLabel.includes('apple') ||
        lowerLabel.includes('carplay') || lowerLabel.includes('bluetooth') ||
        lowerLabel.includes('navigation') || lowerLabel.includes('usb') ||
        lowerLabel.includes('wireless charging') || lowerLabel.includes('wifi') ||
        lowerLabel.includes('voice') || lowerLabel.includes('ota')) {
        return 'infotainment_connectivity';
    }
    // Dimensions & Practicality
    if (lowerLabel.includes('length') || lowerLabel.includes('width') ||
        lowerLabel.includes('height') || lowerLabel.includes('wheelbase') ||
        lowerLabel.includes('wheel base') || lowerLabel.includes('ground clearance') ||
        lowerLabel.includes('boot space') || lowerLabel.includes('kerb weight') ||
        lowerLabel.includes('gross') || lowerLabel.includes('door') ||
        lowerLabel.includes('seating capacity')) {
        return 'dimensions_practicality';
    }
    // Comfort & Convenience
    if (lowerLabel.includes('seat') || lowerLabel.includes('headrest') ||
        lowerLabel.includes('armrest') || lowerLabel.includes('window') ||
        lowerLabel.includes('cup holder') || lowerLabel.includes('drive mode') ||
        lowerLabel.includes('climate') || lowerLabel.includes('ac') ||
        lowerLabel.includes('sunroof') || lowerLabel.includes('cruise control') ||
        lowerLabel.includes('paddle shift') || lowerLabel.includes('keyless') ||
        lowerLabel.includes('push button') || lowerLabel.includes('remote start')) {
        return 'comfort_convenience';
    }
    // Exterior
    if (lowerLabel.includes('antenna') || lowerLabel.includes('orvm') ||
        lowerLabel.includes('headlight') || lowerLabel.includes('tail light') ||
        lowerLabel.includes('fog') || lowerLabel.includes('drl') ||
        lowerLabel.includes('roof rail') || lowerLabel.includes('spoiler') ||
        lowerLabel.includes('boot opening') || lowerLabel.includes('body color')) {
        return 'exterior';
    }
    // Tyres & Wheels
    if (lowerLabel.includes('tyre') || lowerLabel.includes('wheel') ||
        lowerLabel.includes('rim') || lowerLabel.includes('alloy')) {
        return 'tyres_wheels';
    }
    // Interior
    if (lowerLabel.includes('dashboard') || lowerLabel.includes('interior') ||
        lowerLabel.includes('upholstery') || lowerLabel.includes('instrument cluster') ||
        lowerLabel.includes('ambient') || lowerLabel.includes('sunblind')) {
        return 'interior';
    }
    // Mileage
    if (lowerLabel.includes('mileage') || lowerLabel.includes('fuel tank') ||
        lowerLabel.includes('emission')) {
        return 'mileage_range';
    }
    // ADAS
    if (lowerLabel.includes('adaptive') || lowerLabel.includes('lane') ||
        lowerLabel.includes('collision') || lowerLabel.includes('blind spot') ||
        lowerLabel.includes('traffic sign')) {
        return 'adas';
    }
    // Warranty
    if (lowerLabel.includes('warranty')) {
        return 'warranty';
    }
    // Fallback based on section name
    if (lowerSection.includes('engine') || lowerSection.includes('transmission') ||
        lowerSection.includes('motor')) {
        return 'engine_performance';
    }
    if (lowerSection.includes('dimension') || lowerSection.includes('capacity') ||
        lowerSection.includes('weight')) {
        return 'dimensions_practicality';
    }
    if (lowerSection.includes('safety') || lowerSection.includes('security')) {
        return 'safety';
    }
    if (lowerSection.includes('comfort') || lowerSection.includes('convenience') ||
        lowerSection.includes('interior')) {
        return 'comfort_convenience';
    }
    if (lowerSection.includes('exterior') || lowerSection.includes('look')) {
        return 'exterior';
    }
    if (lowerSection.includes('entertainment') || lowerSection.includes('infotainment') ||
        lowerSection.includes('connectivity') || lowerSection.includes('audio')) {
        return 'infotainment_connectivity';
    }
    return 'specs_raw';
}
//# sourceMappingURL=spec-key-map.js.map