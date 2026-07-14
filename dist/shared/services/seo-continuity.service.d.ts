export declare class SEOContinuityService {
    /**
     * Validate that a car's URL will remain permanent during lifecycle transitions
     */
    static validateURLPermanence(car: any): {
        valid: boolean;
        warnings: string[];
    };
    /**
     * Prevent URL changes during lifecycle transition
     */
    static preventURLChangeOnTransition(currentSlug: string, newSlug: string, carId: string): {
        allowed: boolean;
        error?: string;
    };
    /**
     * Ensure canonical URL is set and won't change
     */
    static validateCanonicalURL(carId: string): Promise<{
        has_canonical: boolean;
        canonical_url?: string;
        warning?: string;
    }>;
    /**
     * Create protective redirects for URL permanence
     * When a car transitions, ensure old variants/URLs still resolve
     */
    static createProtectiveRedirects(carId: string, actor: any): Promise<any>;
    /**
     * Track metadata changes for SEO history
     */
    static trackMetadataChange(carId: string, field: string, oldValue: any, newValue: any, actor: any): Promise<void>;
    /**
     * Generate SEO-optimized meta title for state
     */
    static generateMetaTitleForState(carName: string, state: string): string;
    /**
     * Generate SEO-optimized meta description for state
     */
    static generateMetaDescriptionForState(carName: string, state: string, launchDate?: Date): string;
    /**
     * Validate SEO health before major transitions
     */
    static validateSEOHealthBeforeTransition(carId: string): Promise<{
        healthy: boolean;
        issues: string[];
    }>;
}
