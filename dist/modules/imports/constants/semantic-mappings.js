"use strict";
/**
 * Semantic Mapping Registry
 * Maps raw imported feature names (synonyms) to canonical CarSalahakar keys.
 * Enables clean normalization of messy automotive data from multiple sources.
 *
 * Structure:
 * - key: canonical CarSalahakar field key (e.g., "wireless_charger")
 * - category: spec section (engine_performance, battery_charging, etc.)
 * - synonyms: array of imported values that should normalize to this key
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEMANTIC_MAPPINGS = void 0;
exports.buildSemanticLookupTable = buildSemanticLookupTable;
exports.getSemanticMapping = getSemanticMapping;
exports.getSemanticMappingsByCategory = getSemanticMappingsByCategory;
exports.SEMANTIC_MAPPINGS = [
    // ────────────────────────────────────────────────────────────────────────────
    // COMFORT & CONVENIENCE
    // ────────────────────────────────────────────────────────────────────────────
    {
        key: 'wireless_charger',
        category: 'comfort_convenience',
        label: 'Wireless Phone Charger',
        synonyms: [
            'wireless charger',
            'wireless phone charging',
            'wireless charging',
            'qi charger',
            'qi charging',
            'inductive charging',
            'mobile charger wireless',
            'phone charging pad',
        ],
    },
    {
        key: 'automatic_climate_control',
        category: 'comfort_convenience',
        label: 'Automatic Climate Control',
        synonyms: [
            'automatic climate control',
            'auto climate control',
            'climate control',
            'dual zone climate control',
            'tri-zone climate',
            'automatic air conditioning',
            'auto ac',
            'auto air con',
        ],
    },
    {
        key: 'keyless_entry',
        category: 'comfort_convenience',
        label: 'Keyless Entry',
        synonyms: [
            'keyless entry',
            'smart key entry',
            'proximity key',
            'keyless go',
            'hands-free entry',
            'remote entry',
        ],
    },
    {
        key: 'push_button_start',
        category: 'comfort_convenience',
        label: 'Push Button Start',
        synonyms: [
            'push button start',
            'keyless start',
            'button start',
            'start button',
            'smart start',
            'smart key start',
        ],
    },
    {
        key: 'cruise_control',
        category: 'comfort_convenience',
        label: 'Cruise Control',
        synonyms: [
            'cruise control',
            'constant speed control',
            'cc',
            'speed control',
            'adaptive cruise',
        ],
    },
    {
        key: 'ventilated_seats',
        category: 'comfort_convenience',
        label: 'Ventilated Seats',
        synonyms: [
            'ventilated seats',
            'cooled seats',
            'air conditioned seats',
            'ac seats',
            'ventilated front seats',
            'perforated leather',
        ],
    },
    {
        key: 'heated_seats',
        category: 'comfort_convenience',
        label: 'Heated Seats',
        synonyms: [
            'heated seats',
            'heated front seats',
            'seat heater',
            'warming seats',
        ],
    },
    {
        key: 'memory_seats',
        category: 'comfort_convenience',
        label: 'Memory Seats',
        synonyms: [
            'memory seats',
            'memory driver seat',
            'seat memory',
            'driver memory adjustment',
        ],
    },
    {
        key: 'lumbar_support',
        category: 'comfort_convenience',
        label: 'Lumbar Support',
        synonyms: [
            'lumbar support',
            'lumbar adjustment',
            'lower back support',
            'adjustable lumbar',
        ],
    },
    {
        key: 'remote_start',
        category: 'comfort_convenience',
        label: 'Remote Start',
        synonyms: [
            'remote start',
            'remote engine start',
            'remote start/stop',
            'remote engine start/stop',
        ],
    },
    // ────────────────────────────────────────────────────────────────────────────
    // SAFETY & ADAS
    // ────────────────────────────────────────────────────────────────────────────
    {
        key: 'camera_360',
        category: 'safety',
        label: '360-Degree Camera',
        synonyms: [
            '360 camera',
            '360 view camera',
            'surround view camera',
            'bird view camera',
            'bird eye view',
            '360° camera',
            'all-around camera',
            'surround view',
        ],
    },
    {
        key: 'rear_camera',
        category: 'safety',
        label: 'Rear Camera',
        synonyms: [
            'rear camera',
            'reverse camera',
            'backup camera',
            'rear view camera',
            'rear view mirror',
        ],
    },
    {
        key: 'parking_sensors',
        category: 'safety',
        label: 'Parking Sensors',
        synonyms: [
            'parking sensors',
            'rear parking sensors',
            'front parking sensors',
            'ultrasonic sensors',
            'proximity sensors',
            'park assist',
        ],
    },
    {
        key: 'abs',
        category: 'safety',
        label: 'ABS',
        synonyms: [
            'abs',
            'anti-lock braking system',
            'antilock brakes',
            'anti lock braking',
        ],
    },
    {
        key: 'ebd',
        category: 'safety',
        label: 'EBD',
        synonyms: [
            'ebd',
            'electronic brakeforce distribution',
            'brake force distribution',
        ],
    },
    {
        key: 'esp',
        category: 'safety',
        label: 'Electronic Stability Control',
        synonyms: [
            'esp',
            'electronic stability control',
            'stability control',
            'vehicle stability control',
            'vsc',
            'esc',
        ],
    },
    {
        key: 'traction_control',
        category: 'safety',
        label: 'Traction Control',
        synonyms: [
            'traction control',
            'tcs',
            'traction control system',
            'anti-slip',
            'tcs/asr',
        ],
    },
    {
        key: 'hill_hold',
        category: 'safety',
        label: 'Hill Assist',
        synonyms: [
            'hill hold',
            'hill assist',
            'hill start assist',
            'hsa',
            'hill start',
        ],
    },
    {
        key: 'hill_descent',
        category: 'safety',
        label: 'Hill Descent Control',
        synonyms: [
            'hill descent',
            'hill descent control',
            'hdc',
            'descent control',
        ],
    },
    {
        key: 'airbags',
        category: 'safety',
        label: 'Airbags',
        synonyms: [
            'airbags',
            'air bags',
            'dual airbags',
            'multiple airbags',
            'front airbags',
        ],
    },
    {
        key: 'isofix',
        category: 'safety',
        label: 'ISOFIX Child Seat Mounts',
        synonyms: [
            'isofix',
            'iso fix',
            'child seat isofix',
            'child restraint',
        ],
    },
    {
        key: 'tpms',
        category: 'safety',
        label: 'Tyre Pressure Monitoring',
        synonyms: [
            'tpms',
            'tire pressure monitoring',
            'tyre pressure monitoring',
            'tire pressure',
            'tpm sensor',
        ],
    },
    // ADAS Features
    {
        key: 'adaptive_cruise_control',
        category: 'adas',
        label: 'Adaptive Cruise Control',
        synonyms: [
            'adaptive cruise control',
            'acc',
            'automatic cruise control',
        ],
    },
    {
        key: 'lane_keep_assist',
        category: 'adas',
        label: 'Lane Keep Assist',
        synonyms: [
            'lane keep assist',
            'lane keeping assist',
            'lka',
            'lane keeping aid',
        ],
    },
    {
        key: 'lane_departure_warning',
        category: 'adas',
        label: 'Lane Departure Warning',
        synonyms: [
            'lane departure warning',
            'lane departure alert',
            'ldw',
            'lane alert',
        ],
    },
    {
        key: 'blind_spot_monitoring',
        category: 'adas',
        label: 'Blind Spot Monitor',
        synonyms: [
            'blind spot monitoring',
            'blind spot monitor',
            'bsm',
            'blind spot warning',
            'side blind spot alert',
        ],
    },
    {
        key: 'forward_collision_warning',
        category: 'adas',
        label: 'Forward Collision Warning',
        synonyms: [
            'forward collision warning',
            'fcw',
            'collision warning',
            'collision alert',
            'forward alert',
        ],
    },
    {
        key: 'automatic_emergency_braking',
        category: 'adas',
        label: 'Automatic Emergency Braking',
        synonyms: [
            'automatic emergency braking',
            'aeb',
            'emergency braking',
            'auto braking',
            'autonomous emergency braking',
        ],
    },
    {
        key: 'traffic_sign_recognition',
        category: 'adas',
        label: 'Traffic Sign Recognition',
        synonyms: [
            'traffic sign recognition',
            'tsr',
            'sign recognition',
            'traffic sign detection',
        ],
    },
    {
        key: 'driver_attention_warning',
        category: 'adas',
        label: 'Driver Attention Warning',
        synonyms: [
            'driver attention warning',
            'driver drowsiness detection',
            'drowsiness alert',
            'attention alert',
            'fatigue detection',
        ],
    },
    {
        key: 'rear_cross_traffic_alert',
        category: 'adas',
        label: 'Rear Cross-Traffic Alert',
        synonyms: [
            'rear cross traffic alert',
            'rcta',
            'cross traffic alert',
            'rear cross traffic',
        ],
    },
    // ────────────────────────────────────────────────────────────────────────────
    // INFOTAINMENT & CONNECTIVITY
    // ────────────────────────────────────────────────────────────────────────────
    {
        key: 'android_auto',
        category: 'infotainment_connectivity',
        label: 'Android Auto',
        synonyms: [
            'android auto',
            'android automobile',
            'google android auto',
        ],
    },
    {
        key: 'apple_carplay',
        category: 'infotainment_connectivity',
        label: 'Apple CarPlay',
        synonyms: [
            'apple carplay',
            'carplay',
            'apple car play',
            'ios carplay',
        ],
    },
    {
        key: 'bluetooth',
        category: 'infotainment_connectivity',
        label: 'Bluetooth',
        synonyms: [
            'bluetooth',
            'bluetooth connectivity',
            'bt',
            'wireless connectivity',
        ],
    },
    {
        key: 'navigation',
        category: 'infotainment_connectivity',
        label: 'GPS Navigation',
        synonyms: [
            'navigation',
            'gps',
            'gps navigation',
            'built-in navigation',
            'satellite navigation',
        ],
    },
    {
        key: 'voice_command',
        category: 'infotainment_connectivity',
        label: 'Voice Command',
        synonyms: [
            'voice command',
            'voice control',
            'voice recognition',
            'voice activation',
        ],
    },
    {
        key: 'wifi_hotspot',
        category: 'infotainment_connectivity',
        label: 'WiFi Hotspot',
        synonyms: [
            'wifi hotspot',
            'wi-fi hotspot',
            'wifi tethering',
            'hotspot',
        ],
    },
    {
        key: 'internet_connectivity',
        category: 'infotainment_connectivity',
        label: 'Internet Connectivity',
        synonyms: [
            'internet connectivity',
            'connected services',
            'online services',
            'internet',
        ],
    },
    {
        key: 'ota_updates',
        category: 'infotainment_connectivity',
        label: 'OTA Updates',
        synonyms: [
            'ota updates',
            'ota',
            'over the air updates',
            'software updates',
            'wireless updates',
        ],
    },
    // ────────────────────────────────────────────────────────────────────────────
    // EXTERIOR
    // ────────────────────────────────────────────────────────────────────────────
    {
        key: 'led_headlights',
        category: 'exterior',
        label: 'LED Headlights',
        synonyms: [
            'led headlights',
            'led headlamps',
            'led lights',
            'full led headlights',
        ],
    },
    {
        key: 'drl',
        category: 'exterior',
        label: 'LED DRL',
        synonyms: [
            'drl',
            'daytime running lights',
            'led drl',
            'drls',
        ],
    },
    {
        key: 'led_tail_lights',
        category: 'exterior',
        label: 'LED Taillights',
        synonyms: [
            'led tail lights',
            'led taillights',
            'led rear lights',
            'full led',
        ],
    },
    {
        key: 'automatic_headlamps',
        category: 'exterior',
        label: 'Automatic Headlamps',
        synonyms: [
            'automatic headlamps',
            'auto headlights',
            'automatic lights',
            'auto on/off headlights',
        ],
    },
    {
        key: 'follow_me_home',
        category: 'exterior',
        label: 'Follow Me Home Headlamps',
        synonyms: [
            'follow me home',
            'follow me home lights',
            'puddle lights',
            'welcome light',
        ],
    },
    {
        key: 'fog_lights',
        category: 'exterior',
        label: 'Fog Lights',
        synonyms: [
            'fog lights',
            'fog lamps',
            'front fog lights',
            'rear fog lights',
        ],
    },
    {
        key: 'roof_rails',
        category: 'exterior',
        label: 'Roof Rails',
        synonyms: [
            'roof rails',
            'roof racks',
            'roof bars',
            'side rails',
        ],
    },
    {
        key: 'rain_sensing_wipers',
        category: 'exterior',
        label: 'Rain-Sensing Wipers',
        synonyms: [
            'rain sensing wipers',
            'auto wipers',
            'sensor wipers',
            'automatic wipers',
        ],
    },
    // ────────────────────────────────────────────────────────────────────────────
    // INTERIOR
    // ────────────────────────────────────────────────────────────────────────────
    {
        key: 'sunroof',
        category: 'interior',
        label: 'Sunroof',
        synonyms: [
            'sunroof',
            'sun roof',
            'glass roof',
            'manual sunroof',
        ],
    },
    {
        key: 'panoramic_sunroof',
        category: 'interior',
        label: 'Panoramic Sunroof',
        synonyms: [
            'panoramic sunroof',
            'panoramic roof',
            'panorama sunroof',
            'dual panel sunroof',
        ],
    },
    {
        key: 'moonroof',
        category: 'interior',
        label: 'Moonroof',
        synonyms: [
            'moonroof',
            'electric moonroof',
            'automatic sunroof',
        ],
    },
    {
        key: 'ambient_lighting',
        category: 'interior',
        label: 'Cabin Ambient Lighting',
        synonyms: [
            'ambient lighting',
            'ambient lights',
            'cabin lighting',
            'led cabin lights',
            'interior lighting',
        ],
    },
    // ────────────────────────────────────────────────────────────────────────────
    // BATTERY & EV FEATURES (requires powertrain detection)
    // ────────────────────────────────────────────────────────────────────────────
    {
        key: 'regenerative_braking',
        category: 'battery_charging',
        label: 'Regenerative Braking',
        synonyms: [
            'regenerative braking',
            'regen braking',
            'energy recovery',
            'regeneration',
            'kinetic energy recovery',
        ],
    },
    {
        key: 'vehicle_to_load',
        category: 'battery_charging',
        label: 'Vehicle-to-Load (V2L)',
        synonyms: [
            'v2l',
            'vehicle to load',
            'vehicle-to-load',
            'power export',
            'external power supply',
        ],
    },
    {
        key: 'vehicle_to_vehicle',
        category: 'battery_charging',
        label: 'Vehicle-to-Vehicle (V2V)',
        synonyms: [
            'v2v',
            'vehicle to vehicle',
            'vehicle-to-vehicle',
            'v2v charging',
            'bi-directional charging',
        ],
    },
    // ────────────────────────────────────────────────────────────────────────────
    // CONNECTED CAR
    // ────────────────────────────────────────────────────────────────────────────
    {
        key: 'vehicle_tracking',
        category: 'connected_car',
        label: 'Vehicle Tracking',
        synonyms: [
            'vehicle tracking',
            'gps tracking',
            'real-time tracking',
            'live tracking',
        ],
    },
    {
        key: 'geofencing',
        category: 'connected_car',
        label: 'Geo-Fencing',
        synonyms: [
            'geofencing',
            'geo-fencing',
            'geofence',
            'location alert',
            'boundary alert',
        ],
    },
    {
        key: 'remote_lock',
        category: 'connected_car',
        label: 'Remote Lock/Unlock',
        synonyms: [
            'remote lock',
            'remote unlock',
            'remote lock/unlock',
            'app lock',
        ],
    },
    {
        key: 'remote_ac',
        category: 'connected_car',
        label: 'Remote AC Control',
        synonyms: [
            'remote ac',
            'remote climate',
            'remote air conditioning',
            'app ac control',
        ],
    },
    {
        key: 'remote_sunroof',
        category: 'connected_car',
        label: 'Remote Sunroof Control',
        synonyms: [
            'remote sunroof',
            'app sunroof control',
            'remote roof control',
        ],
    },
    {
        key: 'digital_key',
        category: 'connected_car',
        label: 'Digital Key',
        synonyms: [
            'digital key',
            'nfc key',
            'phone as key',
            'smartphone key',
            'nfc unlock',
        ],
    },
    {
        key: 'sos_emergency_assist',
        category: 'connected_car',
        label: 'Emergency SOS Assist',
        synonyms: [
            'sos',
            'emergency sos',
            'emergency assist',
            'sos button',
            'emergency call',
        ],
    },
    // ────────────────────────────────────────────────────────────────────────────
    // STORAGE & PRACTICALITY
    // ────────────────────────────────────────────────────────────────────────────
    {
        key: 'cooled_glovebox',
        category: 'storage_cabin_practicality',
        label: 'Cooled Glovebox',
        synonyms: [
            'cooled glovebox',
            'cooling glovebox',
            'refrigerated glovebox',
            'chilled glovebox',
        ],
    },
    // ────────────────────────────────────────────────────────────────────────────
    // STORAGE: Create reverse mapping for easier lookup
    // ────────────────────────────────────────────────────────────────────────────
];
/**
 * Build a fast lookup table: normalized_synonym → canonical_key
 */
function buildSemanticLookupTable() {
    const table = new Map();
    for (const mapping of exports.SEMANTIC_MAPPINGS) {
        for (const synonym of mapping.synonyms) {
            // Normalize: lowercase, trim, collapse spaces
            const normalized = synonym.toLowerCase().trim().replace(/\s+/g, ' ');
            table.set(normalized, mapping.key);
        }
    }
    return table;
}
/**
 * Get a mapping by canonical key
 */
function getSemanticMapping(key) {
    return exports.SEMANTIC_MAPPINGS.find(m => m.key === key);
}
/**
 * Get all mappings for a category
 */
function getSemanticMappingsByCategory(category) {
    return exports.SEMANTIC_MAPPINGS.filter(m => m.category === category);
}
//# sourceMappingURL=semantic-mappings.js.map