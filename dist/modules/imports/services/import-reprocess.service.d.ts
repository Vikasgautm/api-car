export interface ReprocessResult {
    variant_id: string;
    variant_name: string;
    before: {
        normalized_keys: number;
        raw_keys: number;
        derived_keys: number;
    };
    after: {
        normalized_keys: number;
        raw_keys: number;
        derived_keys: number;
    };
    changed: boolean;
}
export declare class ImportReprocessService {
    static reprocessVariant(variantId: string): Promise<ReprocessResult | null>;
    static reprocessCar(carId: string): Promise<ReprocessResult[]>;
    static reprocessAll(): Promise<{
        total: number;
        succeeded: number;
        failed: number;
        results: ReprocessResult[];
    }>;
}
//# sourceMappingURL=import-reprocess.service.d.ts.map