import { FieldVisibilityState } from '../../../models/car-variant.model';
export declare class VariantLifecycleService {
    /**
     * Set visibility state for a specific section
     */
    static setSectionVisibility(variantId: string, sectionKey: string, visibility: FieldVisibilityState, hiddenFields?: string[]): Promise<import("mongoose").Document<unknown, {}, import("../../../models/car-variant.model").ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-variant.model").ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    /**
     * Set visibility for a specific field
     */
    static setFieldVisibility(variantId: string, fieldKey: string, visibility: FieldVisibilityState, isEstimated?: boolean, confidenceScore?: number): Promise<import("mongoose").Document<unknown, {}, import("../../../models/car-variant.model").ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-variant.model").ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    /**
     * Mark multiple fields as estimated for upcoming variants
     */
    static markFieldsAsEstimated(variantId: string, fieldKeys: string[]): Promise<import("mongoose").Document<unknown, {}, import("../../../models/car-variant.model").ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-variant.model").ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    /**
     * Unhide all sections when variant/car launches
     */
    static unhideAllSections(variantId: string): Promise<import("mongoose").Document<unknown, {}, import("../../../models/car-variant.model").ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-variant.model").ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    /**
     * Get all upcoming variants for a car that need data completion
     */
    static getUpcomingVariantsNeedingData(carId: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/car-variant.model").ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-variant.model").ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    /**
     * Get completeness score for upcoming variant (estimation completeness)
     */
    static getEstimationCompleteness(variantId: string): Promise<{
        variant_id: string;
        variant_name: string;
        is_upcoming: boolean;
        total_estimated_fields: number;
        completed_estimated_fields: number;
        estimation_completion_percent: number;
        field_confidence_scores: Record<string, number>;
    }>;
    /**
     * Create a teaser-only variant (minimal data)
     */
    static createTeaserVariant(variantId: string, teaserData: {
        price?: number;
        launch_date?: Date;
        highlights?: string[];
    }): Promise<import("mongoose").Document<unknown, {}, import("../../../models/car-variant.model").ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-variant.model").ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=variant-lifecycle.service.d.ts.map