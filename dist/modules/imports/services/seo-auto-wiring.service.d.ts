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
export declare class SEOAutoWiringService {
    /**
     * Map canonical keys to SEO preset slugs.
     * Used to auto-create buyer-intent landing page connections.
     */
    private static FEATURE_TO_SEO_PRESET;
    /**
     * Auto-wire SEO connections for a variant (logging phase).
     * Detects enabled features and logs what SEO connections would be created.
     *
     * @param variant_id - The variant to wire
     * @param car_id - Parent car ID
     * @param specs_normalized - Normalized specs (source of truth for features)
     */
    static autoWireVariant(variant_id: string, car_id: string, specs_normalized: Record<string, any> | undefined): Promise<void>;
    /**
     * Extract all enabled boolean features from normalized specs.
     * Recursively walks the spec tree and collects field keys where value = true.
     */
    private static extractEnabledFeatures;
    /**
     * Update SEO connections for a variant after spec changes (logging phase).
     * Logs what SEO connections would be updated based on new specs.
     */
    static updateWiringForVariant(variant_id: string, car_id: string, specs_normalized: Record<string, any> | undefined): Promise<void>;
}
//# sourceMappingURL=seo-auto-wiring.service.d.ts.map