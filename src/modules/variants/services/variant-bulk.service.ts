import { CarVariant } from '../../../models/car-variant.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { VariantValidationService } from './variant-validation.service';
import { VariantIntegrityService } from './variant-integrity.service';

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
  errors: Array<{ variant_id: string; error: string }>;
  updated_variants: any[];
}

export class VariantBulkService {
  static async bulkUpdateVisibility(variantIds: string[], hiddenSections: string[], changedBy: string = 'system'): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      total: variantIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      updated_variants: [],
    };

    // Fetch all before states in parallel
    const beforeVariants = await Promise.allSettled(
      variantIds.map(id => CarVariant.findOne({ variant_id: id }).lean())
    );

    // Bulk update all variants
    const bulkOps = variantIds.map(variantId => ({
      updateOne: {
        filter: { variant_id: variantId },
        update: {
          $set: {
            hidden_sections: hiddenSections,
            updated_at: new Date(),
          }
        }
      }
    }));

    await CarVariant.bulkWrite(bulkOps);

    // Fetch all after states in parallel
    const afterVariants = await Promise.allSettled(
      variantIds.map(id => CarVariant.findOne({ variant_id: id }))
    );

    // Record change history in parallel
    const changeRecordingPromises: Promise<void>[] = [];

    for (let i = 0; i < variantIds.length; i++) {
      const variantId = variantIds[i];
      const beforeResult = beforeVariants[i];
      const afterResult = afterVariants[i];

      if (beforeResult.status === 'fulfilled' && afterResult.status === 'fulfilled' && afterResult.value) {
        result.successful++;
        result.updated_variants.push(afterResult.value.toObject());

        if (beforeResult.value) {
          changeRecordingPromises.push(
            VariantIntegrityService.recordVariantChanges(
              variantId,
              beforeResult.value,
              afterResult.value.toObject(),
              changedBy,
              'bulk_operation'
            ).catch((err: any) => {
              console.warn(
                `Failed to record change history for variant ${variantId}: ${err?.message || err}`
              );
            })
          );
        }
      } else {
        result.failed++;
        result.errors.push({
          variant_id: variantId,
          error: 'Failed to update variant',
        });
      }
    }

    // Wait for all change recordings in parallel
    await Promise.all(changeRecordingPromises);

    return result;
  }

  static async bulkUpdateStatus(variantIds: string[], status: string, changedBy: string = 'system'): Promise<BulkOperationResult> {
    const validStatuses = ['draft', 'incomplete', 'review_pending', 'hidden', 'launched', 'upcoming', 'discontinued'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status: ${status}`, 400);
    }

    const result: BulkOperationResult = {
      total: variantIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      updated_variants: [],
    };

    // Fetch all before states in parallel
    const beforeVariants = await Promise.allSettled(
      variantIds.map(id => CarVariant.findOne({ variant_id: id }).lean())
    );

    // Bulk update all variants
    const bulkOps = variantIds.map(variantId => ({
      updateOne: {
        filter: { variant_id: variantId },
        update: {
          $set: {
            variant_status: status,
            updated_at: new Date(),
          }
        }
      }
    }));

    await CarVariant.bulkWrite(bulkOps);

    // Fetch all after states in parallel
    const afterVariants = await Promise.allSettled(
      variantIds.map(id => CarVariant.findOne({ variant_id: id }))
    );

    // Record change history in parallel
    const changeRecordingPromises: Promise<void>[] = [];

    for (let i = 0; i < variantIds.length; i++) {
      const variantId = variantIds[i];
      const beforeResult = beforeVariants[i];
      const afterResult = afterVariants[i];

      if (beforeResult.status === 'fulfilled' && afterResult.status === 'fulfilled' && afterResult.value) {
        result.successful++;
        result.updated_variants.push(afterResult.value.toObject());

        if (beforeResult.value) {
          changeRecordingPromises.push(
            VariantIntegrityService.recordVariantChanges(
              variantId,
              beforeResult.value,
              afterResult.value.toObject(),
              changedBy,
              'bulk_operation'
            ).catch((err: any) => {
              console.warn(
                `Failed to record change history for variant ${variantId}: ${err?.message || err}`
              );
            })
          );
        }
      } else {
        result.failed++;
        result.errors.push({
          variant_id: variantId,
          error: 'Failed to update variant',
        });
      }
    }

    // Wait for all change recordings in parallel
    await Promise.all(changeRecordingPromises);

    return result;
  }

  static async bulkPublish(variantIds: string[], shouldPublish: boolean, changedBy: string = 'system'): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      total: variantIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      updated_variants: [],
    };

    // Validation in parallel if needed
    const validationResults: Map<string, any> = new Map();
    if (shouldPublish) {
      const validations = await Promise.allSettled(
        variantIds.map(id => VariantValidationService.validateVariant(id))
      );
      validations.forEach((v, idx) => {
        if (v.status === 'fulfilled') {
          validationResults.set(variantIds[idx], v.value);
        }
      });
    }

    // Fetch all before states in parallel
    const beforeVariants = await Promise.allSettled(
      variantIds.map(id => CarVariant.findOne({ variant_id: id }).lean())
    );

    // Bulk update all variants
    const bulkOps = variantIds
      .filter(variantId => {
        // Skip if validation failed
        if (shouldPublish && validationResults.has(variantId)) {
          const validation = validationResults.get(variantId);
          if (!validation.isValid) {
            result.failed++;
            result.errors.push({
              variant_id: variantId,
              error: `Validation failed: ${validation.errors[0]?.message}`,
            });
            return false;
          }
        }
        return true;
      })
      .map(variantId => ({
        updateOne: {
          filter: { variant_id: variantId },
          update: {
            $set: {
              is_published: shouldPublish,
              published_at: shouldPublish ? new Date() : null,
              updated_at: new Date(),
            }
          }
        }
      }));

    if (bulkOps.length > 0) {
      await CarVariant.bulkWrite(bulkOps);
    }

    // Fetch all after states in parallel
    const afterVariants = await Promise.allSettled(
      variantIds.map(id => CarVariant.findOne({ variant_id: id }))
    );

    // Record change history in parallel
    const changeRecordingPromises: Promise<void>[] = [];

    for (let i = 0; i < variantIds.length; i++) {
      const variantId = variantIds[i];
      const beforeResult = beforeVariants[i];
      const afterResult = afterVariants[i];

      if (beforeResult.status === 'fulfilled' && afterResult.status === 'fulfilled' && afterResult.value) {
        result.successful++;
        result.updated_variants.push(afterResult.value.toObject());

        if (beforeResult.value) {
          changeRecordingPromises.push(
            VariantIntegrityService.recordVariantChanges(
              variantId,
              beforeResult.value,
              afterResult.value.toObject(),
              changedBy,
              'bulk_operation'
            ).catch((err: any) => {
              console.warn(
                `Failed to record change history for variant ${variantId}: ${err?.message || err}`
              );
            })
          );
        }
      } else if (beforeResult.status === 'rejected' || afterResult.status === 'rejected') {
        result.failed++;
        result.errors.push({
          variant_id: variantId,
          error: 'Failed to update variant',
        });
      }
    }

    // Wait for all change recordings in parallel
    await Promise.all(changeRecordingPromises);

    return result;
  }

  static async bulkUpdate(request: BulkUpdateRequest, changedBy: string = 'system'): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      total: request.variant_ids.length,
      successful: 0,
      failed: 0,
      errors: [],
      updated_variants: [],
    };

    // Fetch all before states in parallel
    const beforeVariants = await Promise.allSettled(
      request.variant_ids.map(id => CarVariant.findOne({ variant_id: id }).lean())
    );

    // Build bulk operations
    const bulkOps = request.variant_ids.map(variantId => {
      const updateData: any = { updated_at: new Date() };

      if (request.updates.variant_status) {
        updateData.variant_status = request.updates.variant_status;
      }
      if (request.updates.is_published !== undefined) {
        updateData.is_published = request.updates.is_published;
        if (request.updates.is_published) {
          updateData.published_at = new Date();
        }
      }
      if (request.updates.hidden_sections) {
        updateData.hidden_sections = request.updates.hidden_sections;
      }
      if (request.updates.hidden_spec_keys) {
        updateData.hidden_spec_keys = request.updates.hidden_spec_keys;
      }

      return {
        updateOne: {
          filter: { variant_id: variantId },
          update: { $set: updateData }
        }
      };
    });

    // Execute bulk update
    if (bulkOps.length > 0) {
      await CarVariant.bulkWrite(bulkOps);
    }

    // Fetch all after states in parallel
    const afterVariants = await Promise.allSettled(
      request.variant_ids.map(id => CarVariant.findOne({ variant_id: id }))
    );

    // Record change history in parallel
    const changeRecordingPromises: Promise<void>[] = [];

    for (let i = 0; i < request.variant_ids.length; i++) {
      const variantId = request.variant_ids[i];
      const beforeResult = beforeVariants[i];
      const afterResult = afterVariants[i];

      if (beforeResult.status === 'fulfilled' && afterResult.status === 'fulfilled' && afterResult.value) {
        result.successful++;
        result.updated_variants.push(afterResult.value.toObject());

        if (beforeResult.value) {
          changeRecordingPromises.push(
            VariantIntegrityService.recordVariantChanges(
              variantId,
              beforeResult.value,
              afterResult.value.toObject(),
              changedBy,
              'bulk_operation'
            ).catch((err: any) => {
              console.warn(
                `Failed to record change history for variant ${variantId}: ${err?.message || err}`
              );
            })
          );
        }
      } else {
        result.failed++;
        result.errors.push({
          variant_id: variantId,
          error: 'Failed to update variant',
        });
      }
    }

    // Wait for all change recordings in parallel
    await Promise.all(changeRecordingPromises);

    return result;
  }

  static async bulkValidate(variantIds: string[]) {
    const validationResults: Record<string, any> = {};

    // Parallelize validation instead of sequential
    const validations = await Promise.allSettled(
      variantIds.map(id => VariantValidationService.validateVariant(id))
    );

    validations.forEach((result, idx) => {
      const variantId = variantIds[idx];
      if (result.status === 'fulfilled') {
        validationResults[variantId] = result.value;
      } else {
        validationResults[variantId] = {
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        };
      }
    });

    return validationResults;
  }

  static async bulkExportCsv(variantIds: string[]): Promise<string> {
    const variants = await CarVariant.find({
      variant_id: { $in: variantIds },
    }).select('variant_id variant_name car_id fuel_type_id transmission_type seating_capacity ex_showroom_price variant_status is_published model_year');

    if (variants.length === 0) {
      throw new AppError('No variants found', 404);
    }

    const headers = [
      'variant_id',
      'variant_name',
      'car_id',
      'fuel_type_id',
      'transmission_type',
      'seating_capacity',
      'ex_showroom_price',
      'variant_status',
      'is_published',
      'model_year',
    ];

    let csv = headers.join(',') + '\n';

    variants.forEach((v) => {
      const obj = v.toObject();
      const row = headers.map((h) => {
        const val = obj[h as keyof typeof obj];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csv += row.join(',') + '\n';
    });

    return csv;
  }
}
