import { AuditActor } from '../../../shared/utils/audit.util';
interface PartialVariantImportData {
    variant_name?: string;
    expected_price?: number;
    expected_launch_date?: string;
    variant_highlights?: string[];
    estimated_fields?: Record<string, boolean>;
    specs_partial?: Record<string, any>;
    visibility_mode?: 'teaser' | 'partial' | 'hidden';
}
export declare class PartialImportService {
    /**
     * Import partial/teaser data for an upcoming variant
     * This is lenient about missing fields and marks them as estimated
     */
    static importPartialVariant(carId: string, variantData: PartialVariantImportData, actor: AuditActor): Promise<any>;
    /**
     * Update existing variant with partial data
     */
    private static updatePartialVariant;
    /**
     * Apply partial specs to normalized structure
     * Only fill in what's provided, leave rest empty
     */
    private static applyPartialSpecs;
    /**
     * Apply visibility mode to variant
     */
    private static applyVisibilityMode;
    /**
     * Convert partial variant to full variant on launch
     * Unhide all sections and update market status
     */
    static promotePartialToLaunched(variantId: string, actor: AuditActor): Promise<import("../../../models/car-variant.model").ICarVariant & import("../../../sql/common/BaseModel").SQLDocument>;
    /**
     * Validate that partial import has minimum required data
     */
    static validatePartialImport(data: PartialVariantImportData): {
        valid: boolean;
        errors: string[];
    };
}
export {};
