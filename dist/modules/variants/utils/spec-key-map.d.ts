import { SpecsNormalized } from '../../../models/car-variant.model';
export type SpecValueType = 'string' | 'number' | 'boolean' | 'transmission' | 'array';
export interface SpecMapping {
    category: string;
    key: string;
    path?: string;
    rootKey?: string;
    type: SpecValueType;
}
export declare const SPEC_LABEL_MAP: Record<string, SpecMapping>;
export declare const INVALID_LABELS: string[];
export declare function normalizeLabel(label: string): string;
export declare function isInvalidLabel(label: string): boolean;
export declare function getSpecMapping(label: string): SpecMapping | null;
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
export declare function parseSpecValue(value: string, type: SpecMapping['type']): any;
export declare function guessCategory(label: string, section: string): string;
export interface DerivedFeatureFlags {
    has_sunroof?: boolean;
    sunroof_type?: 'panoramic' | 'moonroof' | 'standard';
    has_panoramic_sunroof?: boolean;
    has_airbags?: boolean;
    has_2_airbags?: boolean;
    has_4_airbags?: boolean;
    has_6_airbags?: boolean;
    has_8_airbags?: boolean;
    airbag_count?: number;
    is_5_star_safety?: boolean;
    is_4_star_safety?: boolean;
    ncap_stars?: number;
    has_adas?: boolean;
    has_full_adas?: boolean;
    adas_count?: number;
    has_led_headlights?: boolean;
    has_led_drls?: boolean;
    has_full_led_package?: boolean;
    is_ev?: boolean;
    is_hybrid?: boolean;
    is_turbo?: boolean;
    has_wireless_charging?: boolean;
    has_360_camera?: boolean;
    has_ventilated_seats?: boolean;
    has_alloy_wheels?: boolean;
    has_cruise_control?: boolean;
    has_adaptive_cruise?: boolean;
    has_auto_climate?: boolean;
    has_push_button_start?: boolean;
    has_connected_car?: boolean;
    has_app_connectivity?: boolean;
    has_rear_camera?: boolean;
    has_parking_sensors?: boolean;
}
export declare function deriveFeatureFlags(specs_normalized: Partial<SpecsNormalized>, specs_raw: Record<string, any>, rootFields?: {
    fuel_type?: string;
    transmission_type?: string;
}): DerivedFeatureFlags;
//# sourceMappingURL=spec-key-map.d.ts.map