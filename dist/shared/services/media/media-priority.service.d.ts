export interface ImageRecord {
    url: string;
    main_category?: string;
    sub_category?: string;
    is_primary?: boolean;
    media_scope?: string;
    status?: string;
    sort_order?: number;
}
export declare class MediaPriorityService {
    /**
     * From a list of published images for one car, return the best thumbnail:
     *   1. top_variant_showcase
     *   2. is_primary=true standard image
     *   3. exterior by priority order (front_left > front > side_left …)
     *   4. interior by priority order
     *   5. first available image
     */
    static selectCardThumbnail(images: ImageRecord[]): ImageRecord | null;
    /**
     * Sort images within a category tab by the priority list first,
     * then by sort_order for remaining items.
     */
    static sortByPriority(images: ImageRecord[], mainCategory: string): ImageRecord[];
}
//# sourceMappingURL=media-priority.service.d.ts.map