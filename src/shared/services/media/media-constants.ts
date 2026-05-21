// ─── Main categories (fixed enum — no admin-created categories) ───────────────

export const MAIN_CATEGORIES = ['exterior', 'interior', 'colours', 'features'] as const;
export type MainCategory = typeof MAIN_CATEGORIES[number];

// ─── Sub-categories by main category ─────────────────────────────────────────

export const EXTERIOR_SUBCATEGORIES = [
  'front', 'front_left', 'front_right', 'side_left', 'side_right',
  'rear', 'rear_left', 'rear_right', 'top', 'grille', 'headlight',
  'tail_light', 'alloy_wheel', 'fog_lamp', 'ground_clearance', 'charging_port',
] as const;
export type ExteriorSubCategory = typeof EXTERIOR_SUBCATEGORIES[number];

export const INTERIOR_SUBCATEGORIES = [
  'dashboard', 'steering', 'infotainment', 'instrument_cluster',
  'front_seats', 'rear_seats', 'sunroof', 'ac_controls', 'wireless_charger',
  'gear_lever', 'door_pad', 'ambient_lighting', 'speaker', 'boot_space',
] as const;
export type InteriorSubCategory = typeof INTERIOR_SUBCATEGORIES[number];

export const COLOURS_SUBCATEGORIES = [
  'white', 'black', 'red', 'blue', 'silver', 'grey',
  'green', 'brown', 'orange', 'dual_tone',
] as const;
export type ColourSubCategory = typeof COLOURS_SUBCATEGORIES[number];

export const FEATURES_SUBCATEGORIES = [
  'adas', '360_camera', 'connected_car', 'wireless_android_auto',
  'wireless_apple_carplay', 'ventilated_seats', 'powered_tailgate',
  'panoramic_sunroof', 'boss_mode', 'air_purifier', 'heads_up_display',
  'drive_modes', 'electronic_parking_brake',
] as const;
export type FeatureSubCategory = typeof FEATURES_SUBCATEGORIES[number];

export const ALL_SUBCATEGORIES = [
  ...EXTERIOR_SUBCATEGORIES,
  ...INTERIOR_SUBCATEGORIES,
  ...COLOURS_SUBCATEGORIES,
  ...FEATURES_SUBCATEGORIES,
] as const;
export type SubCategory = typeof ALL_SUBCATEGORIES[number];

export const SUBCATEGORIES_BY_CATEGORY: Record<MainCategory, readonly string[]> = {
  exterior: EXTERIOR_SUBCATEGORIES,
  interior: INTERIOR_SUBCATEGORIES,
  colours: COLOURS_SUBCATEGORIES,
  features: FEATURES_SUBCATEGORIES,
};

// ─── Media scope ──────────────────────────────────────────────────────────────

export const MEDIA_SCOPES = ['standard', 'top_variant_showcase'] as const;
export type MediaScope = typeof MEDIA_SCOPES[number];

// ─── Image status workflow ────────────────────────────────────────────────────

export const IMAGE_STATUSES = ['draft', 'published', 'archived', 'rejected'] as const;
export type ImageStatus = typeof IMAGE_STATUSES[number];

// ─── Allowed / rejected MIME types ───────────────────────────────────────────

export const ALLOWED_AUTOMOTIVE_MIME_TYPES = [
  'image/avif',
  'image/webp',
  'image/png',
  'image/jpeg',
] as const;

export const SVG_ALLOWED_MIME_TYPES = ['image/svg+xml'] as const;

export const REJECTED_MIME_TYPES = [
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/heic',
  'image/heif',
] as const;

export const ALLOWED_EXTENSIONS = ['.avif', '.webp', '.png', '.jpeg', '.jpg'];
export const SVG_EXTENSIONS = ['.svg'];
export const REJECTED_EXTENSIONS = ['.gif', '.bmp', '.tiff', '.tif', '.heic', '.heif'];

// ─── Priority tables ──────────────────────────────────────────────────────────

export const EXTERIOR_PRIORITY: string[] = [
  'front_left', 'front', 'side_left', 'rear_left', 'rear',
];

export const INTERIOR_PRIORITY: string[] = [
  'dashboard', 'steering', 'infotainment', 'front_seats',
];

// ─── Display name map for SEO auto-generation ─────────────────────────────────

export const SUBCATEGORY_DISPLAY_NAMES: Record<string, string> = {
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

export const COLOUR_HEX_MAP: Record<string, string> = {
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
