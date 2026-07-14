export declare class SEOTagGeneratorService {
    /**
     * Generate SEO tags from derived flags.
     * @param specsRaw - The specs_raw object containing .derived flags
     * @returns Array of SEO tag strings safe for buyer-facing UI
     */
    static generateTagsFromDerivedFlags(specsRaw?: Record<string, any>): string[];
    /**
     * Merge generated tags with existing best_for_tags, avoiding duplicates.
     * Preserves user-edited tags, appends auto-generated tags.
     * @param existingTags - Current best_for_tags from variant
     * @param generatedTags - Tags from generateTagsFromDerivedFlags
     * @returns Merged array of tags
     */
    static mergeTags(existingTags: string[] | undefined, generatedTags: string[]): string[];
}
