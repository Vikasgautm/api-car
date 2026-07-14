import { ICarVariant, SpecsNormalized } from "../../../models/car-variant.model";
import { AuditActor } from "../../../shared/utils/audit.util";
export declare class CarVariantService {
    private static SECTION_NAME_TO_KEY_MAP;
    static removeHiddenSpecKeys(specs_normalized: SpecsNormalized | undefined, hidden_spec_keys?: string[]): SpecsNormalized | undefined;
    static removeHiddenSections(specs_normalized: SpecsNormalized | undefined, hidden_sections: string[] | undefined): SpecsNormalized | undefined;
    static applyFuelTypeFilter(specs_normalized: SpecsNormalized | undefined, fuel_type_ref: string | {
        name?: string;
        slug?: string;
    } | any): SpecsNormalized | undefined;
    static removeEmptyValues(specs_normalized: SpecsNormalized | undefined): SpecsNormalized | undefined;
    static autoHideEmptySections(specs_normalized: SpecsNormalized | undefined): SpecsNormalized | undefined;
    static getAllVariants(filterDto: any, includeDeleted?: boolean): Promise<{
        variants: (ICarVariant & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getVariantById(variantId: string): Promise<(ICarVariant & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static getVariantBySlug(slug: string): Promise<(ICarVariant & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static getGroupedVariants(filterDto: any): Promise<{
        groups: {
            car_id: any;
            car_name: any;
            car_slug: any;
            brand_id: any;
            brand_name: any;
            body_type_id: any;
            body_type_name: any;
            variant_count_total: number;
            variant_count_live: number;
            variant_count_hidden: number;
            variant_count_draft: number;
            variants: any[];
        }[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    private static buildUniqueVariantSlug;
    static createVariant(variantData: any, actor?: AuditActor | null): Promise<any>;
    static cloneVariant(sourceVariantId: string, overrides?: {
        variant_name?: string;
    }, actor?: AuditActor | null): Promise<any>;
    static updateVariant(variantId: string, variantData: any, actor?: AuditActor | null): Promise<ICarVariant & import("../../../sql/common/BaseModel").SQLDocument>;
    static deleteVariant(variantId: string, actor?: AuditActor | null): Promise<ICarVariant & import("../../../sql/common/BaseModel").SQLDocument>;
    static restoreVariant(variantId: string, actor?: AuditActor | null): Promise<ICarVariant & import("../../../sql/common/BaseModel").SQLDocument>;
    static togglePublish(variantId: string, actor?: AuditActor | null): Promise<ICarVariant & import("../../../sql/common/BaseModel").SQLDocument>;
    static publishVariant(variantId: string, actor?: AuditActor | null): Promise<ICarVariant & import("../../../sql/common/BaseModel").SQLDocument>;
    static unpublishVariant(variantId: string, actor?: AuditActor | null): Promise<ICarVariant & import("../../../sql/common/BaseModel").SQLDocument>;
    static archiveVariant(variantId: string, archivedBy?: string, actor?: AuditActor | null): Promise<ICarVariant & import("../../../sql/common/BaseModel").SQLDocument>;
    static unarchiveVariant(variantId: string, actor?: AuditActor | null): Promise<ICarVariant & import("../../../sql/common/BaseModel").SQLDocument>;
    /**
     * Phase 2: Enhance variant data with normalization and powertrain detection.
     * Auto-normalize specs if specs_raw is provided, update powertrain flags.
     */
    private static enhanceVariantWithNormalization;
}
