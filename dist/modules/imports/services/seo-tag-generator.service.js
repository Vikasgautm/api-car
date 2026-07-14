"use strict";
// ─── SEO TAG GENERATOR ────────────────────────────────────────────────────────
// Layer 8: Maps derived feature flags (specs_raw.derived) to buyer-first SEO tags.
// These tags populate variant.best_for_tags for filters, landing pages, and comparisons.
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEOTagGeneratorService = void 0;
class SEOTagGeneratorService {
    /**
     * Generate SEO tags from derived flags.
     * @param specsRaw - The specs_raw object containing .derived flags
     * @returns Array of SEO tag strings safe for buyer-facing UI
     */
    static generateTagsFromDerivedFlags(specsRaw) {
        const tags = new Set();
        if (!specsRaw?.derived) {
            return [];
        }
        const derived = specsRaw.derived;
        // Sunroof / Moonroof
        if (derived.has_sunroof) {
            tags.add('sunroof');
        }
        if (derived.sunroof_type === 'panoramic' || derived.panoramic_sunroof) {
            tags.add('panoramic sunroof');
        }
        // Safety ratings & ADAS
        if (derived.is_5_star_safety) {
            tags.add('5-star safety');
        }
        if (derived.is_4_star_safety) {
            tags.add('4-star safety');
        }
        if (derived.has_6_airbags) {
            tags.add('6+ airbags');
        }
        if (derived.has_full_adas) {
            tags.add('autonomous tech');
        }
        if (derived.adas_count && derived.adas_count >= 5) {
            tags.add('advanced safety');
        }
        // Lighting
        if (derived.has_full_led_package) {
            tags.add('full LED lighting');
        }
        if (derived.led_headlights) {
            tags.add('LED headlights');
        }
        // Infotainment & Connectivity
        if (derived.has_connected_car) {
            tags.add('connected car');
        }
        if (derived.has_wireless_charging) {
            tags.add('wireless charging');
        }
        if (derived.has_panoramic_sunroof) {
            tags.add('panoramic sunroof');
        }
        // Powertrain
        if (derived.is_ev) {
            tags.add('electric');
        }
        if (derived.is_hybrid) {
            tags.add('hybrid');
        }
        if (derived.has_turbo) {
            tags.add('turbocharged');
        }
        // Comfort features
        if (derived.has_heated_seats) {
            tags.add('heated seats');
        }
        if (derived.has_ventilated_seats) {
            tags.add('ventilated seats');
        }
        if (derived.has_cruise_control) {
            tags.add('cruise control');
        }
        if (derived.has_ambient_lighting) {
            tags.add('ambient lighting');
        }
        // Transmission
        if (derived.automatic_transmission) {
            tags.add('automatic');
        }
        return Array.from(tags).sort();
    }
    /**
     * Merge generated tags with existing best_for_tags, avoiding duplicates.
     * Preserves user-edited tags, appends auto-generated tags.
     * @param existingTags - Current best_for_tags from variant
     * @param generatedTags - Tags from generateTagsFromDerivedFlags
     * @returns Merged array of tags
     */
    static mergeTags(existingTags, generatedTags) {
        const merged = new Set();
        // Add existing tags first (user edits)
        if (existingTags) {
            existingTags.forEach(tag => merged.add(tag));
        }
        // Add generated tags
        generatedTags.forEach(tag => merged.add(tag));
        return Array.from(merged).sort();
    }
}
exports.SEOTagGeneratorService = SEOTagGeneratorService;
