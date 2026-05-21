export interface BulkUpdateRequest {
    variant_ids: string[];
    updates: {
        variant_status?: string;
        is_published?: boolean;
        hidden_sections?: string[];
        hidden_spec_keys?: string[];
    };
}
export interface BulkOperationResult {
    total: number;
    successful: number;
    failed: number;
    errors: Array<{
        variant_id: string;
        error: string;
    }>;
    updated_variants: any[];
    change_record_failures?: number;
}
export declare class VariantBulkService {
    static bulkUpdateVisibility(variantIds: string[], hiddenSections: string[], changedBy?: string): Promise<BulkOperationResult>;
    static bulkUpdateStatus(variantIds: string[], status: string, changedBy?: string): Promise<BulkOperationResult>;
    static bulkPublish(variantIds: string[], shouldPublish: boolean, changedBy?: string): Promise<BulkOperationResult>;
    static bulkUpdate(request: BulkUpdateRequest, changedBy?: string): Promise<BulkOperationResult>;
    static bulkValidate(variantIds: string[]): Promise<Record<string, any>>;
    static bulkExportCsv(variantIds: string[]): Promise<string>;
}
//# sourceMappingURL=variant-bulk.service.d.ts.map