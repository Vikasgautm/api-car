import { CarVariant } from '../../../models/car-variant.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { VariantValidationService } from './variant-validation.service';

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
  static async bulkUpdateVisibility(variantIds: string[], hiddenSections: string[]): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      total: variantIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      updated_variants: [],
    };

    for (const variantId of variantIds) {
      try {
        const variant = await CarVariant.findByIdAndUpdate(
          variantId,
          {
            hidden_sections: hiddenSections,
            updated_at: new Date(),
          },
          { new: true }
        );

        if (variant) {
          result.successful++;
          result.updated_variants.push(variant.toObject());
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          variant_id: variantId,
          error: (error as Error).message,
        });
      }
    }

    return result;
  }

  static async bulkUpdateStatus(variantIds: string[], status: string): Promise<BulkOperationResult> {
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

    for (const variantId of variantIds) {
      try {
        const variant = await CarVariant.findByIdAndUpdate(
          variantId,
          {
            variant_status: status,
            updated_at: new Date(),
          },
          { new: true }
        );

        if (variant) {
          result.successful++;
          result.updated_variants.push(variant.toObject());
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          variant_id: variantId,
          error: (error as Error).message,
        });
      }
    }

    return result;
  }

  static async bulkPublish(variantIds: string[], shouldPublish: boolean): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      total: variantIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      updated_variants: [],
    };

    for (const variantId of variantIds) {
      try {
        // Validate before publishing
        if (shouldPublish) {
          const validation = await VariantValidationService.validateVariant(variantId);
          if (!validation.isValid) {
            result.failed++;
            result.errors.push({
              variant_id: variantId,
              error: `Validation failed: ${validation.errors[0]?.message}`,
            });
            continue;
          }
        }

        const variant = await CarVariant.findByIdAndUpdate(
          variantId,
          {
            is_published: shouldPublish,
            published_at: shouldPublish ? new Date() : null,
            updated_at: new Date(),
          },
          { new: true }
        );

        if (variant) {
          result.successful++;
          result.updated_variants.push(variant.toObject());
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          variant_id: variantId,
          error: (error as Error).message,
        });
      }
    }

    return result;
  }

  static async bulkUpdate(request: BulkUpdateRequest): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      total: request.variant_ids.length,
      successful: 0,
      failed: 0,
      errors: [],
      updated_variants: [],
    };

    for (const variantId of request.variant_ids) {
      try {
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

        const variant = await CarVariant.findByIdAndUpdate(variantId, updateData, { new: true });

        if (variant) {
          result.successful++;
          result.updated_variants.push(variant.toObject());
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          variant_id: variantId,
          error: (error as Error).message,
        });
      }
    }

    return result;
  }

  static async bulkValidate(variantIds: string[]) {
    const validationResults: Record<string, any> = {};

    for (const variantId of variantIds) {
      try {
        validationResults[variantId] = await VariantValidationService.validateVariant(variantId);
      } catch (error) {
        validationResults[variantId] = {
          error: (error as Error).message,
        };
      }
    }

    return validationResults;
  }

  static async bulkExportCsv(variantIds: string[]): Promise<string> {
    const variants = await CarVariant.find({
      _id: { $in: variantIds.map((id) => id) },
    }).select('variant_name car_id fuel_type_id transmission_type seating_capacity ex_showroom_price variant_status is_published model_year');

    if (variants.length === 0) {
      throw new AppError('No variants found', 404);
    }

    const headers = [
      '_id',
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
        const val = h === '_id' ? obj._id.toString() : obj[h as keyof typeof obj];
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
