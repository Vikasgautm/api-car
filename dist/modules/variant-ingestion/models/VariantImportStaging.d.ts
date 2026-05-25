import { Document, Types } from 'mongoose';
export type ImportStatus = 'imported' | 'grouped' | 'linked' | 'validation_failed' | 'reviewed' | 'ready_to_push' | 'pushed' | 'rejected' | 'draft';
export interface ValidationIssue {
    field: string;
    message: string;
    severity: 'error' | 'warning';
}
export interface IVariantImportStaging extends Document {
    source_car_name: string;
    normalized_car_name: string;
    variant_name: string;
    price?: number;
    fuel_type?: string;
    transmission?: string;
    raw_specs: Record<string, any>;
    normalized_specs: Record<string, any>;
    suggested_car_id?: string;
    suggested_car_name?: string;
    linked_car_id?: string;
    linked_car_name?: string;
    confidence_score: number;
    completeness_score: number;
    validation_results: ValidationIssue[];
    import_status: ImportStatus;
    import_session_id?: Types.ObjectId;
    imported_by: string;
    reviewed_by?: string;
    linked_by?: string;
    pushed_by?: string;
    pushed_variant_id?: string;
    rejection_reason?: string;
    created_at: Date;
    updated_at: Date;
}
export declare const VariantImportStaging: import("mongoose").Model<IVariantImportStaging, {}, {}, {}, Document<unknown, {}, IVariantImportStaging, {}, import("mongoose").DefaultSchemaOptions> & IVariantImportStaging & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IVariantImportStaging>;
//# sourceMappingURL=VariantImportStaging.d.ts.map