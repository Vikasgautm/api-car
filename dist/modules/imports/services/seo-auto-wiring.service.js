"use strict";
/**
 * Phase 5: SEO Auto-Wiring Service (Logging Phase)
 *
 * When a variant has a normalized spec that maps to a canonical feature key,
 * detect and log what SEO connections would be created for buyer-intent queries.
 *
 * Example:
 * - specs_normalized.comfort_convenience.wireless_charger = true
 *   → Log that "cars-with-wireless-charging" SEO preset should be wired
 *
 * Note: Full Discovery/DiscoveryConnection models will be implemented
 * in the cross-site connectivity (Batch 5) phase.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEOAutoWiringService = void 0;
class SEOAutoWiringService {
    /**
     * Map canonical keys to SEO preset slugs.
     * Used to auto-create buyer-intent landing page connections.
     */
    static FEATURE_TO_SEO_PRESET = {
        // Comfort & Convenience
        'wireless_charger': 'cars-with-wireless-charging',
        'automatic_climate_control': 'cars-with-automatic-climate-control',
        'sunroof': 'cars-with-sunroof',
        'panoramic_sunroof': 'cars-with-panoramic-sunroof',
        'ambient_lighting': 'cars-with-ambient-lighting',
        'cruise_control': 'cars-with-cruise-control',
        // Safety
        'camera_360': 'cars-with-360-camera',
        'rear_camera': 'cars-with-rear-camera',
        'abs': 'cars-with-abs',
        'airbags': 'cars-with-airbags',
        // Battery & Charging (EV-specific)
        'vehicle_to_load': 'cars-with-v2l',
        'vehicle_to_vehicle': 'cars-with-v2v',
        // Connected Car
        'android_auto': 'cars-with-android-auto',
        'apple_carplay': 'cars-with-apple-carplay',
        'ota_updates': 'cars-with-ota-updates',
        // ADAS
        'adaptive_cruise_control': 'cars-with-adaptive-cruise-control',
        'lane_keep_assist': 'cars-with-lane-keep-assist',
        'blind_spot_monitoring': 'cars-with-blind-spot-monitoring',
    };
    /**
     * Auto-wire SEO connections for a variant (logging phase).
     * Detects enabled features and logs what SEO connections would be created.
     *
     * @param variant_id - The variant to wire
     * @param car_id - Parent car ID
     * @param specs_normalized - Normalized specs (source of truth for features)
     */
    static async autoWireVariant(variant_id, car_id, specs_normalized) {
        if (!specs_normalized) {
            return; // Nothing to wire
        }
        try {
            // Extract all enabled features from specs_normalized
            const enabledFeatures = this.extractEnabledFeatures(specs_normalized);
            const presets = enabledFeatures
                .map(f => this.FEATURE_TO_SEO_PRESET[f])
                .filter(Boolean);
            if (presets.length > 0) {
                console.log(`[SEO Auto-Wiring] Variant ${variant_id} (car: ${car_id}) would wire to: ${presets.join(', ')}`);
            }
        }
        catch (error) {
            // Log but don't fail — SEO auto-wiring is an enhancement
            console.warn(`Failed to analyze SEO wiring for variant ${variant_id}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Extract all enabled boolean features from normalized specs.
     * Recursively walks the spec tree and collects field keys where value = true.
     */
    static extractEnabledFeatures(specs) {
        const features = [];
        const walk = (obj) => {
            if (!obj || typeof obj !== 'object') {
                return;
            }
            for (const [key, value] of Object.entries(obj)) {
                // Skip nested objects, only process boolean features
                if (typeof value === 'boolean' && value === true) {
                    features.push(key);
                }
                else if (typeof value === 'object' && !Array.isArray(value)) {
                    walk(value);
                }
            }
        };
        walk(specs);
        return features;
    }
    /**
     * Update SEO connections for a variant after spec changes (logging phase).
     * Logs what SEO connections would be updated based on new specs.
     */
    static async updateWiringForVariant(variant_id, car_id, specs_normalized) {
        if (!specs_normalized) {
            return;
        }
        try {
            const enabledFeatures = this.extractEnabledFeatures(specs_normalized);
            const presets = enabledFeatures
                .map(f => this.FEATURE_TO_SEO_PRESET[f])
                .filter(Boolean);
            if (presets.length > 0) {
                console.log(`[SEO Auto-Wiring Update] Variant ${variant_id} (car: ${car_id}) updated wiring to: ${presets.join(', ')}`);
            }
        }
        catch (error) {
            console.warn(`Failed to update SEO wiring analysis for variant ${variant_id}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.SEOAutoWiringService = SEOAutoWiringService;
//# sourceMappingURL=seo-auto-wiring.service.js.map