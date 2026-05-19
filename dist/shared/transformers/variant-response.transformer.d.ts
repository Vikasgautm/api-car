/**
 * Variant Response Transformer
 * Transforms raw variant documents into display-ready flat objects
 * for admin frontend consumption
 */
export interface VariantDisplayDto {
    variant_id: string;
    variant_name: string;
    slug: string;
    model_year: number;
    transmission_type: string;
    drivetrain?: string;
    seating_capacity?: number;
    ex_showroom_price?: number;
    expected_price?: number;
    is_published: boolean;
    is_archived: boolean;
    car_id: string;
    car_name: string;
    car_slug: string;
    brand_id: string;
    brand_name: string;
    body_type_id: string;
    body_type_name: string;
    fuel_type_id?: string;
    fuel_type_name?: string;
    created_at: string;
    updated_at: string;
}
export declare class VariantResponseTransformer {
    private static carCache;
    private static brandCache;
    private static bodyTypeCache;
    private static fuelTypeCache;
    /**
     * Transform a single variant document into display-ready format
     */
    static transform(variant: any): Promise<VariantDisplayDto>;
    /**
     * Transform array of variants with minimal cache overhead
     */
    static transformBatch(variants: any[]): Promise<VariantDisplayDto[]>;
    /**
     * Clear all caches (call after batch operations)
     */
    static clearCache(): void;
    private static getCar;
    private static getBrand;
    private static getBodyType;
    private static getFuelType;
}
//# sourceMappingURL=variant-response.transformer.d.ts.map