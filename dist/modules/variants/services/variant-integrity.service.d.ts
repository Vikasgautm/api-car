import { ICarVariant } from '../../../models/car-variant.model';
export declare class VariantIntegrityService {
    /**
     * Validate variant against automotive constraint rules (Batch 6 Feature 5)
     * Prevents impossible combinations (EV with fuel tank, invalid transmissions, etc.)
     */
    static validateAutomotiveConstraints(variant: Record<string, any>): Promise<{
        isValid: boolean;
        errors: Array<{
            rule: string;
            message: string;
        }>;
        warnings: Array<{
            rule: string;
            message: string;
        }>;
    }>;
    /**
     * Enforce source priority when merging variant data from multiple sources (Batch 6 Feature 4)
     * Higher priority source (OEM > Platform > AI) overwrites lower priority
     */
    static mergeVariantWithSourcePriority(existing: Partial<ICarVariant>, incoming: Partial<ICarVariant>, incomingSource: string, incomingConfidence?: number): {
        merged: Partial<ICarVariant>;
        changes: Array<{
            field: string;
            oldValue: any;
            newValue: any;
            reason: string;
        }>;
    };
    /**
     * Track changes to variant (Batch 6 Feature 2)
     * Records what changed, who changed it, when, and why
     */
    static recordVariantChanges(variantId: string, oldData: Record<string, any>, newData: Record<string, any>, changedBy: string, changeSource?: 'manual_edit' | 'import' | 'bulk_operation' | 'system' | 'api'): Promise<void>;
    /**
     * Track spec changes separately with section info (Batch 6 Feature 2)
     */
    static recordSpecChanges(variantId: string, oldSpecs: Record<string, any>, newSpecs: Record<string, any>, changedBy: string, changeSource?: 'manual_edit' | 'import' | 'bulk_operation' | 'system' | 'api'): Promise<void>;
    /**
     * Get variant change history with optional filtering (Batch 6 Feature 2)
     */
    static getChangeHistory(variantId: string, options?: {
        field?: string;
        source?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<any[]>;
    /**
     * Get audit trail for variant as formatted string
     */
    static getAuditTrail(variantId: string): Promise<string>;
    /**
     * Validate variant and return comprehensive validation result (combines integrity + constraints)
     */
    static comprehensiveValidate(variantId: string): Promise<{
        isValid: boolean;
        automotiveErrors: Array<{
            rule: string;
            message: string;
        }>;
        automotiveWarnings: Array<{
            rule: string;
            message: string;
        }>;
        hasSourceMetadata: boolean;
        lastChangedAt?: Date;
        lastChangedBy?: string;
    }>;
    private static flattenSpecs;
    private static flattenSpecsToObject;
    private static unflattenSpecs;
}
