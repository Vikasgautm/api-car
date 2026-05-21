import { CarVariant } from '../../../models/car-variant.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { logger } from '../../../utils/logger';
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
  change_record_failures?: number;
}

async function runChangeRecording(
  promises: Promise<void>[],
  label: string,
): Promise<void> {
  if (promises.length === 0) return;
  const results = await Promise.allSettled(promises);
  const failedCount = results.filter(r => r.status === 'rejected').length;
  if (failedCount > 0) {
    logger.warn(`${failedCount} of ${promises.length} change record(s) failed in ${label}`);
  }
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

    const beforeVariants = await Promise.allSettled(
      variantIds.map(id => CarVariant.findOne({ variant_id: id }).lean())
    );

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

    const changeRecordingPromises: Promise<void>[] = [];

    for (let i = 0; i < variantIds.length; i++) {
      const variantId = variantIds[i];
      const beforeResult = beforeVariants[i];

      if (beforeResult.status === 'fulfilled' && beforeResult.value) {
        const afterObj = { ...beforeResult.value, hidden_sections: hiddenSections, updated_at: new Date() };
        result.successful++;
        result.updated_variants.push(afterObj);

        changeRecordingPromises.push(
          VariantIntegrityService.recordVariantChanges(
            variantId,
            beforeResult.value,
            afterObj,
            changedBy,
            'bulk_operation'
          )
        );
      } else {
        result.failed++;
        result.errors.push({ variant_id: variantId, error: 'Failed to update variant' });
      }
    }

    await runChangeRecording(changeRecordingPromises, 'bulkUpdateVisibility');
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

    const beforeVariants = await Promise.allSettled(
      variantIds.map(id => CarVariant.findOne({ variant_id: id }).lean())
    );

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

    const changeRecordingPromises: Promise<void>[] = [];

    for (let i = 0; i < variantIds.length; i++) {
      const variantId = variantIds[i];
      const beforeResult = beforeVariants[i];

      if (beforeResult.status === 'fulfilled' && beforeResult.value) {
        const afterObj = { ...beforeResult.value, variant_status: status, updated_at: new Date() };
        result.successful++;
        result.updated_variants.push(afterObj);

        changeRecordingPromises.push(
          VariantIntegrityService.recordVariantChanges(
            variantId,
            beforeResult.value,
            afterObj,
            changedBy,
            'bulk_operation'
          )
        );
      } else {
        result.failed++;
        result.errors.push({ variant_id: variantId, error: 'Failed to update variant' });
      }
    }

    await runChangeRecording(changeRecordingPromises, 'bulkUpdateStatus');
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

    const beforeVariants = await Promise.allSettled(
      variantIds.map(id => CarVariant.findOne({ variant_id: id }).lean())
    );

    const publishedAt = shouldPublish ? new Date() : null;

    const bulkOps = variantIds
      .filter(variantId => {
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
              published_at: publishedAt,
              updated_at: new Date(),
            }
          }
        }
      }));

    if (bulkOps.length > 0) {
      await CarVariant.bulkWrite(bulkOps);
    }

    const changeRecordingPromises: Promise<void>[] = [];
    const filteredSet = new Set(bulkOps.map((op: any) => op.updateOne.filter.variant_id));

    for (let i = 0; i < variantIds.length; i++) {
      const variantId = variantIds[i];
      if (!filteredSet.has(variantId)) continue;

      const beforeResult = beforeVariants[i];

      if (beforeResult.status === 'fulfilled' && beforeResult.value) {
        const afterObj = { ...beforeResult.value, is_published: shouldPublish, published_at: publishedAt, updated_at: new Date() };
        result.successful++;
        result.updated_variants.push(afterObj);

        changeRecordingPromises.push(
          VariantIntegrityService.recordVariantChanges(
            variantId,
            beforeResult.value,
            afterObj,
            changedBy,
            'bulk_operation'
          )
        );
      } else {
        result.failed++;
        result.errors.push({ variant_id: variantId, error: 'Failed to update variant' });
      }
    }

    await runChangeRecording(changeRecordingPromises, 'bulkPublish');
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

    const beforeVariants = await Promise.allSettled(
      request.variant_ids.map(id => CarVariant.findOne({ variant_id: id }).lean())
    );

    const sharedUpdate: any = { updated_at: new Date() };
    if (request.updates.variant_status) sharedUpdate.variant_status = request.updates.variant_status;
    if (request.updates.is_published !== undefined) {
      sharedUpdate.is_published = request.updates.is_published;
      if (request.updates.is_published) sharedUpdate.published_at = new Date();
    }
    if (request.updates.hidden_sections) sharedUpdate.hidden_sections = request.updates.hidden_sections;
    if (request.updates.hidden_spec_keys) sharedUpdate.hidden_spec_keys = request.updates.hidden_spec_keys;

    const bulkOps = request.variant_ids.map(variantId => ({
      updateOne: {
        filter: { variant_id: variantId },
        update: { $set: sharedUpdate }
      }
    }));

    if (bulkOps.length > 0) {
      await CarVariant.bulkWrite(bulkOps);
    }

    const changeRecordingPromises: Promise<void>[] = [];

    for (let i = 0; i < request.variant_ids.length; i++) {
      const variantId = request.variant_ids[i];
      const beforeResult = beforeVariants[i];

      if (beforeResult.status === 'fulfilled' && beforeResult.value) {
        const afterObj = { ...beforeResult.value, ...sharedUpdate };
        result.successful++;
        result.updated_variants.push(afterObj);

        changeRecordingPromises.push(
          VariantIntegrityService.recordVariantChanges(
            variantId,
            beforeResult.value,
            afterObj,
            changedBy,
            'bulk_operation'
          )
        );
      } else {
        result.failed++;
        result.errors.push({ variant_id: variantId, error: 'Failed to update variant' });
      }
    }

    await runChangeRecording(changeRecordingPromises, 'bulkUpdate');
    return result;
  }

  static async bulkValidate(variantIds: string[]) {
    const validationResults: Record<string, any> = {};

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
