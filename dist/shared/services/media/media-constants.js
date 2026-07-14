"use strict";
// ─── Main categories (fixed enum — no admin-created categories) ───────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLOUR_HEX_MAP = exports.SUBCATEGORY_DISPLAY_NAMES = exports.INTERIOR_PRIORITY = exports.EXTERIOR_PRIORITY = exports.REJECTED_EXTENSIONS = exports.SVG_EXTENSIONS = exports.ALLOWED_EXTENSIONS = exports.REJECTED_MIME_TYPES = exports.SVG_ALLOWED_MIME_TYPES = exports.ALLOWED_AUTOMOTIVE_MIME_TYPES = exports.IMAGE_STATUSES = exports.MEDIA_SCOPES = exports.SUBCATEGORIES_BY_CATEGORY = exports.ALL_SUBCATEGORIES = exports.FEATURES_SUBCATEGORIES = exports.COLOURS_SUBCATEGORIES = exports.INTERIOR_SUBCATEGORIES = exports.EXTERIOR_SUBCATEGORIES = exports.MAIN_CATEGORIES = void 0;
exports.MAIN_CATEGORIES = ['exterior', 'interior', 'colours', 'features'];
// ─── Sub-categories by main category ─────────────────────────────────────────
exports.EXTERIOR_SUBCATEGORIES = [
    'front', 'front_left', 'front_right', 'side_left', 'side_right',
    'rear', 'rear_left', 'rear_right', 'top', 'grille', 'headlight',
    'tail_light', 'alloy_wheel', 'fog_lamp', 'ground_clearance', 'charging_port',
];
exports.INTERIOR_SUBCATEGORIES = [
    'dashboard', 'steering', 'infotainment', 'instrument_cluster',
    'front_seats', 'rear_seats', 'sunroof', 'ac_controls', 'wireless_charger',
    'gear_lever', 'door_pad', 'ambient_lighting', 'speaker', 'boot_space',
];
exports.COLOURS_SUBCATEGORIES = [
    'white', 'black', 'red', 'blue', 'silver', 'grey',
    'green', 'brown', 'orange', 'dual_tone',
];
exports.FEATURES_SUBCATEGORIES = [
    'adas', '360_camera', 'connected_car', 'wireless_android_auto',
    'wireless_apple_carplay', 'ventilated_seats', 'powered_tailgate',
    'panoramic_sunroof', 'boss_mode', 'air_purifier', 'heads_up_display',
    'drive_modes', 'electronic_parking_brake',
];
exports.ALL_SUBCATEGORIES = [
    ...exports.EXTERIOR_SUBCATEGORIES,
    ...exports.INTERIOR_SUBCATEGORIES,
    ...exports.COLOURS_SUBCATEGORIES,
    ...exports.FEATURES_SUBCATEGORIES,
];
exports.SUBCATEGORIES_BY_CATEGORY = {
    exterior: exports.EXTERIOR_SUBCATEGORIES,
    interior: exports.INTERIOR_SUBCATEGORIES,
    colours: exports.COLOURS_SUBCATEGORIES,
    features: exports.FEATURES_SUBCATEGORIES,
};
// ─── Media scope ──────────────────────────────────────────────────────────────
exports.MEDIA_SCOPES = ['standard', 'top_variant_showcase'];
// ─── Image status workflow ────────────────────────────────────────────────────
exports.IMAGE_STATUSES = ['draft', 'published', 'archived', 'rejected'];
// ─── Allowed / rejected MIME types ───────────────────────────────────────────
exports.ALLOWED_AUTOMOTIVE_MIME_TYPES = [
    'image/avif',
    'image/webp',
    'image/png',
    'image/jpeg',
];
exports.SVG_ALLOWED_MIME_TYPES = ['image/svg+xml'];
exports.REJECTED_MIME_TYPES = [
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/heic',
    'image/heif',
];
exports.ALLOWED_EXTENSIONS = ['.avif', '.webp', '.png', '.jpeg', '.jpg'];
exports.SVG_EXTENSIONS = ['.svg'];
exports.REJECTED_EXTENSIONS = ['.gif', '.bmp', '.tiff', '.tif', '.heic', '.heif'];
// ─── Priority tables ──────────────────────────────────────────────────────────
exports.EXTERIOR_PRIORITY = [
    'front_left', 'front', 'side_left', 'rear_left', 'rear',
];
exports.INTERIOR_PRIORITY = [
    'dashboard', 'steering', 'infotainment', 'front_seats',
];
// ─── Display name map for SEO auto-generation ─────────────────────────────────
exports.SUBCATEGORY_DISPLAY_NAMES = {
    // Exterior
    front: 'Front View',
    front_left: 'Front Left View',
    front_right: 'Front Right View',
    side_left: 'Left Side Profile',
    side_right: 'Right Side Profile',
    rear: 'Rear View',
    rear_left: 'Rear Left View',
    rear_right: 'Rear Right View',
    top: 'Top View',
    grille: 'Front Grille',
    headlight: 'Headlight',
    tail_light: 'Tail Light',
    alloy_wheel: 'Alloy Wheel',
    fog_lamp: 'Fog Lamp',
    ground_clearance: 'Ground Clearance',
    charging_port: 'Charging Port',
    // Interior
    dashboard: 'Dashboard Interior',
    steering: 'Steering Wheel',
    infotainment: 'Infotainment System',
    instrument_cluster: 'Instrument Cluster',
    front_seats: 'Front Seats',
    rear_seats: 'Rear Seats',
    sunroof: 'Sunroof',
    ac_controls: 'AC Controls',
    wireless_charger: 'Wireless Charger',
    gear_lever: 'Gear Lever',
    door_pad: 'Door Pad',
    ambient_lighting: 'Ambient Lighting',
    speaker: 'Speaker',
    boot_space: 'Boot Space',
    // Colours
    white: 'White Colour',
    black: 'Black Colour',
    red: 'Red Colour',
    blue: 'Blue Colour',
    silver: 'Silver Colour',
    grey: 'Grey Colour',
    green: 'Green Colour',
    brown: 'Brown Colour',
    orange: 'Orange Colour',
    dual_tone: 'Dual Tone Colour',
    // Features
    adas: 'ADAS',
    '360_camera': '360 Camera',
    connected_car: 'Connected Car',
    wireless_android_auto: 'Wireless Android Auto',
    wireless_apple_carplay: 'Wireless Apple CarPlay',
    ventilated_seats: 'Ventilated Seats',
    powered_tailgate: 'Powered Tailgate',
    panoramic_sunroof: 'Panoramic Sunroof',
    boss_mode: 'Boss Mode',
    air_purifier: 'Air Purifier',
    heads_up_display: 'Heads-Up Display',
    drive_modes: 'Drive Modes',
    electronic_parking_brake: 'Electronic Parking Brake',
};
// ─── Colour normalisation (colours sub_category → hex) ────────────────────────
exports.COLOUR_HEX_MAP = {
    white: '#FFFFFF',
    black: '#000000',
    red: '#C0392B',
    blue: '#2980B9',
    silver: '#C0C0C0',
    grey: '#7F8C8D',
    green: '#27AE60',
    brown: '#8B4513',
    orange: '#E67E22',
    dual_tone: '#808080',
};
