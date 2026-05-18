export declare class CarIntegrityService {
    /**
     * Track changes to car (Batch 6 Feature 2)
     * Records what changed, who changed it, when, and why
     */
    static recordCarChanges(carId: string, oldData: Record<string, any>, newData: Record<string, any>, changedBy: string, changeSource?: 'manual_edit' | 'import' | 'bulk_operation' | 'system' | 'api'): Promise<void>;
    /**
     * Get car change history with optional filtering
     */
    static getChangeHistory(carId: string, options?: {
        field?: string;
        source?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<any[]>;
    /**
     * Get audit trail for car as formatted string
     */
    static getAuditTrail(carId: string): Promise<string>;
    /**
     * Get comprehensive change summary
     */
    static getChangeSummary(carId: string): Promise<{
        totalChanges: number;
        changedFields: string[];
        changedBy: string[];
        changeSources: string[];
        lastChange?: {
            field: string;
            changedAt: Date;
            changedBy: string;
        };
    }>;
    /**
     * Detect aggregation fields that need to be recomputed
     * Used to invalidate cache when relevant changes occur
     */
    static detectAggregationInvalidation(changes: Array<{
        field: string;
    }>): {
        needsAggregationRecompute: boolean;
        affectedAggregates: string[];
    };
}
//# sourceMappingURL=car-integrity.service.d.ts.map