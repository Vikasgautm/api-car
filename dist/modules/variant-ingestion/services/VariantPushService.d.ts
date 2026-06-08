export interface PushResult {
    staging_id: string;
    variant_id?: string;
    success: boolean;
    error?: string;
    action: 'created' | 'skipped' | 'failed';
}
export declare class VariantPushService {
    static pushVariant(stagingId: string, pushedBy: string): Promise<PushResult>;
    static pushBulk(stagingIds: string[], pushedBy: string): Promise<PushResult[]>;
    static getDiff(stagingId: string): Promise<{
        field: string;
        existing: any;
        imported: any;
    }[]>;
    private static extractRootFields;
    private static extractModelYear;
    private static buildSlug;
}
//# sourceMappingURL=VariantPushService.d.ts.map