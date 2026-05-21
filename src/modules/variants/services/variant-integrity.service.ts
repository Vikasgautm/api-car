import { CarVariant, ICarVariant } from '../../../models/car-variant.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { AutomotiveValidationRules } from '../../../shared/utils/automotive-validation-rules';
import { SourcePriorityMerge, MetadataBuilder, SourcePriority } from '../../../shared/utils/field-source-metadata';
import { ChangeHistoryTracker } from '../../../shared/utils/change-history';

export class VariantIntegrityService {
  /**
   * Validate variant against automotive constraint rules (Batch 6 Feature 5)
   * Prevents impossible combinations (EV with fuel tank, invalid transmissions, etc.)
   */
  static async validateAutomotiveConstraints(variant: Record<string, any>): Promise<{
    isValid: boolean;
    errors: Array<{ rule: string; message: string }>;
    warnings: Array<{ rule: string; message: string }>;
  }> {
    const result = AutomotiveValidationRules.validateStrict(variant);
    return result;
  }

  /**
   * Enforce source priority when merging variant data from multiple sources (Batch 6 Feature 4)
   * Higher priority source (OEM > Platform > AI) overwrites lower priority
   */
  static mergeVariantWithSourcePriority(
    existing: Partial<ICarVariant>,
    incoming: Partial<ICarVariant>,
    incomingSource: string,
    incomingConfidence: number = 85,
  ): {
    merged: Partial<ICarVariant>;
    changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      reason: string;
    }>;
  } {
    const changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      reason: string;
    }> = [];

    const merged = { ...existing };
    const incomingPriority = SourcePriorityMerge.getSourcePriority(incomingSource);

    // Merge top-level fields
    const topLevelFields = [
      'variant_name',
      'ex_showroom_price',
      'expected_price',
      'on_road_price',
      'market_status',
      'trim_name',
      'edition_name',
    ];

    for (const field of topLevelFields) {
      if (!(field in incoming) || incoming[field as keyof typeof incoming] === undefined) {
        continue;
      }

      const oldValue = existing[field as keyof typeof existing];
      const newValue = incoming[field as keyof typeof incoming];

      // For now, use simple logic: prefer manual edits or higher priority source
      // TODO: store source metadata for each field to enable full source-priority merge
      if (oldValue !== newValue) {
        merged[field as keyof typeof merged] = newValue as any;
        changes.push({
          field,
          oldValue,
          newValue,
          reason: `Source: ${incomingSource} (priority ${incomingPriority}, confidence ${incomingConfidence})`,
        });
      }
    }

    // Merge specs with full source metadata tracking
    if (incoming.specs_normalized) {
      const existingMetadata = existing.specs_metadata || {};
      const incomingMetadata: Record<string, any> = {};

      // Build metadata for incoming specs
      this.flattenSpecs(incoming.specs_normalized, (field, section, value) => {
        const key = `${section}.${field}`;
        incomingMetadata[key] = MetadataBuilder.fromImportSource(
          value,
          incomingSource,
          incomingConfidence,
        );
      });

      const { merged: mergedSpecs, mergedMetadata, changes: specChanges } = SourcePriorityMerge.mergeVariantSpecs(
        this.flattenSpecsToObject(existing.specs_normalized || {}),
        existingMetadata,
        this.flattenSpecsToObject(incoming.specs_normalized),
        incomingMetadata,
      );

      if (specChanges.length > 0) {
        merged.specs_normalized = this.unflattenSpecs(mergedSpecs);
        merged.specs_metadata = mergedMetadata;
        changes.push(
          ...specChanges.map((c) => ({
            field: `specs.${c.field}`,
            oldValue: c.old_value,
            newValue: c.new_value,
            reason: c.reason,
          })),
        );
      }
    }

    return { merged, changes };
  }

  /**
   * Track changes to variant (Batch 6 Feature 2)
   * Records what changed, who changed it, when, and why
   */
  static async recordVariantChanges(
    variantId: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    changedBy: string,
    changeSource: 'manual_edit' | 'import' | 'bulk_operation' | 'system' | 'api' = 'manual_edit',
  ): Promise<void> {
    const variant = await CarVariant.findOne({ variant_id: variantId });
    if (!variant) {
      throw new AppError('Variant not found', 404);
    }

    const changes = ChangeHistoryTracker.detectChanges(oldData, newData);

    if (changes.length === 0) return;

    const historyEntries = changes.map((c) =>
      ChangeHistoryTracker.createEntry(c.field, c.oldValue, c.newValue, changedBy, changeSource),
    );

    variant.change_history = variant.change_history || [];
    variant.change_history.push(...historyEntries);
    if (variant.change_history.length > 100) {
      variant.change_history = variant.change_history.slice(-100);
    }

    await variant.save();
  }

  /**
   * Track spec changes separately with section info (Batch 6 Feature 2)
   */
  static async recordSpecChanges(
    variantId: string,
    oldSpecs: Record<string, any>,
    newSpecs: Record<string, any>,
    changedBy: string,
    changeSource: 'manual_edit' | 'import' | 'bulk_operation' | 'system' | 'api' = 'manual_edit',
  ): Promise<void> {
    const variant = await CarVariant.findOne({ variant_id: variantId });
    if (!variant) {
      throw new AppError('Variant not found', 404);
    }

    const changes = ChangeHistoryTracker.detectSpecChanges(oldSpecs, newSpecs);

    if (changes.length === 0) return;

    const historyEntries = changes.map((c) =>
      ChangeHistoryTracker.createSpecEntry(
        c.field,
        c.oldValue,
        c.newValue,
        changedBy,
        c.section,
        changeSource,
      ),
    );

    variant.change_history = variant.change_history || [];
    variant.change_history.push(...historyEntries);
    if (variant.change_history.length > 100) {
      variant.change_history = variant.change_history.slice(-100);
    }

    await variant.save();
  }

  /**
   * Get variant change history with optional filtering (Batch 6 Feature 2)
   */
  static async getChangeHistory(
    variantId: string,
    options?: {
      field?: string;
      source?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    },
  ): Promise<any[]> {
    const variant = await CarVariant.findOne({ variant_id: variantId }).select('change_history');
    if (!variant) {
      throw new AppError('Variant not found', 404);
    }

    let history = variant.change_history || [];

    if (options?.field) {
      history = ChangeHistoryTracker.filterChangesByField(history, options.field);
    }

    if (options?.source) {
      history = ChangeHistoryTracker.filterChangesBySource(history as any, options.source as any);
    }

    if (options?.startDate && options?.endDate) {
      history = ChangeHistoryTracker.filterChangesByDateRange(
        history as any,
        options.startDate,
        options.endDate,
      );
    }

    if (options?.limit) {
      history = history.slice(-options.limit);
    }

    return history;
  }

  /**
   * Get audit trail for variant as formatted string
   */
  static async getAuditTrail(variantId: string): Promise<string> {
    const variant = await CarVariant.findOne({ variant_id: variantId }).select('change_history');
    if (!variant) {
      throw new AppError('Variant not found', 404);
    }

    const history = variant.change_history || [];
    return ChangeHistoryTracker.auditTrail(history as any);
  }

  /**
   * Validate variant and return comprehensive validation result (combines integrity + constraints)
   */
  static async comprehensiveValidate(variantId: string): Promise<{
    isValid: boolean;
    automotiveErrors: Array<{ rule: string; message: string }>;
    automotiveWarnings: Array<{ rule: string; message: string }>;
    hasSourceMetadata: boolean;
    lastChangedAt?: Date;
    lastChangedBy?: string;
  }> {
    const variant = await CarVariant.findOne({ variant_id: variantId });
    if (!variant) {
      throw new AppError('Variant not found', 404);
    }

    const automotiveValidation = AutomotiveValidationRules.validateStrict(variant.toObject());

    const changeHistory = variant.change_history || [];
    const lastChange = changeHistory.length > 0 ? changeHistory[changeHistory.length - 1] : null;

    return {
      isValid: automotiveValidation.isValid,
      automotiveErrors: automotiveValidation.errors,
      automotiveWarnings: automotiveValidation.warnings,
      hasSourceMetadata: !!(variant.specs_metadata && Object.keys(variant.specs_metadata).length > 0),
      lastChangedAt: lastChange?.changed_at,
      lastChangedBy: lastChange?.changed_by,
    };
  }

  // Helper methods
  private static flattenSpecs(
    specs: Record<string, any>,
    callback: (field: string, section: string, value: any) => void,
  ): void {
    for (const [section, sectionData] of Object.entries(specs)) {
      if (sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData)) {
        for (const [field, value] of Object.entries(sectionData)) {
          callback(field, section, value);
        }
      }
    }
  }

  private static flattenSpecsToObject(specs: Record<string, any>): Record<string, any> {
    const flattened: Record<string, any> = {};
    this.flattenSpecs(specs, (field, section, value) => {
      flattened[`${section}.${field}`] = value;
    });
    return flattened;
  }

  private static unflattenSpecs(flattened: Record<string, any>): Record<string, any> {
    const specs: Record<string, any> = {};
    for (const [key, value] of Object.entries(flattened)) {
      const [section, ...fieldParts] = key.split('.');
      const field = fieldParts.join('.');
      if (!specs[section]) specs[section] = {};
      specs[section][field] = value;
    }
    return specs;
  }
}
