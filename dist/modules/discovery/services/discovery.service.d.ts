import { MileageClass } from '../../../constants/mileage-benchmarks';
/**
 * Discovery filter input. All keys are optional. Plural slug keys accept either
 * a CSV string from a query string or an actual array (when called from JSON
 * bodies, e.g. by the SeoPreset hydrator).
 *
 * Prices are stored in **rupees** (matching the Car/CarVariant model). The
 * frontend can convert from Lakhs (1 L = ₹100,000) before submitting.
 */
export interface DiscoveryFilters {
    q?: string;
    tags?: string | string[];
    intent?: string | string[];
    brand_slugs?: string | string[];
    body_type_slugs?: string | string[];
    fuel_type_slugs?: string | string[];
    tags_mode?: 'any' | 'all';
    min_price?: number | string;
    max_price?: number | string;
    seating_min?: number | string;
    seating_max?: number | string;
    transmission?: string | string[];
    safety_min_airbags?: number | string;
    adas?: boolean | string;
    mileage_class?: string | string[];
    range_class?: string | string[];
    status?: string | string[];
    is_electric?: boolean | string;
    page?: number | string;
    limit?: number | string;
    sortBy?: SortKey;
}
export type SortKey = 'price_asc' | 'price_desc' | 'mileage' | 'range' | 'popularity' | 'newest' | 'name';
export interface DiscoveryFacetCount {
    value: string;
    label?: string;
    count: number;
}
export interface DiscoveryFacets {
    brand: DiscoveryFacetCount[];
    body_type: DiscoveryFacetCount[];
    fuel_type: DiscoveryFacetCount[];
    status: DiscoveryFacetCount[];
    mileage_class: DiscoveryFacetCount[];
    range_class: DiscoveryFacetCount[];
    is_electric: DiscoveryFacetCount[];
    tags: DiscoveryFacetCount[];
}
export interface ResolvedFilters {
    q?: string;
    tag_ids: string[];
    tag_match_mode: 'any' | 'all';
    brand_ids: string[];
    body_type_ids: string[];
    fuel_type_ids: string[];
    min_price?: number;
    max_price?: number;
    seating_min?: number;
    seating_max?: number;
    transmissions: string[];
    safety_min_airbags?: number;
    adas?: boolean;
    mileage_class: string[];
    range_class: string[];
    statuses: string[];
    is_electric?: boolean;
    show_hidden_statuses: boolean;
}
export declare class DiscoveryService {
    /**
     * Resolve the public-facing filter shape (slugs, csvs, etc.) into the
     * concrete id/value shape used by the Car/CarVariant queries. Done once per
     * request because every facet count re-uses the resolved set.
     */
    static resolveFilters(filters: DiscoveryFilters): Promise<ResolvedFilters>;
    /**
     * Filter variants by the variant-level dimensions (price, transmission,
     * seating, safety, adas) and return the distinct car_ids they belong to.
     * Returns null when the caller passed no variant-level filters, so callers can
     * skip the secondary query entirely.
     */
    static getCarIdsFromVariantFilters(resolved: ResolvedFilters): Promise<string[] | null>;
    /**
     * Apply the car-level filters, returning the Mongo filter object.
     * `excludeDimension` lets the facet pipeline drop one dimension at a time so
     * each facet's counts reflect *everything except* that dimension.
     */
    static buildCarFilter(resolved: ResolvedFilters, variantMatchedCarIds: string[] | null, excludeDimension?: keyof DiscoveryFacets): Record<string, unknown>;
    static getSortClause(sortBy: SortKey | undefined): Record<string, 1 | -1>;
    /** Full discovery query: list + pagination + facet counts. */
    static discover(filters: DiscoveryFilters): Promise<{
        cars: (import("../../../models/car.model").ICar & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
        facets: DiscoveryFacets;
        applied: ResolvedFilters;
    }>;
    /**
     * Build the facet count breakdowns. Each dimension is counted using the same
     * filter as the main query, minus that dimension — standard faceted search.
     */
    static buildFacets(resolved: ResolvedFilters, variantMatchedCarIds: string[] | null): Promise<DiscoveryFacets>;
    /** Lightweight count-only call used by SEO preset preview. */
    static count(filters: DiscoveryFilters): Promise<number>;
}
export type DiscoveryMileageClass = MileageClass;
//# sourceMappingURL=discovery.service.d.ts.map