export interface FallbackImageResult {
    url: string;
    alt_text: string;
    level: 'variant_showcase' | 'standard' | 'brand' | 'body_type' | 'placeholder';
}
export declare class MediaFallbackService {
    /**
     * Global fallback chain for any image slot:
     * 1. top_variant_showcase image for the car
     * 2. standard car image (primary or priority-selected)
     * 3. brand thumbnail from the car document
     * 4. body-type placeholder (future: keyed on body_type)
     * 5. static default placeholder
     */
    static resolveImage(carId: string): Promise<FallbackImageResult>;
}
