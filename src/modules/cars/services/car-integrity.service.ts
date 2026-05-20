import { Car, ICar } from '../../../models/car.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { ChangeHistoryTracker } from '../../../shared/utils/change-history';

export class CarIntegrityService {
  /**
   * Track changes to car (Batch 6 Feature 2)
   * Records what changed, who changed it, when, and why
   */
  static async recordCarChanges(
    carId: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    changedBy: string,
    changeSource: 'manual_edit' | 'import' | 'bulk_operation' | 'system' | 'api' = 'manual_edit',
  ): Promise<void> {
    const car = await Car.findOne({ car_id: carId });
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    const changes = ChangeHistoryTracker.detectChanges(oldData, newData);

    if (changes.length === 0) return;

    const historyEntries = changes.map((c) =>
      ChangeHistoryTracker.createEntry(c.field, c.oldValue, c.newValue, changedBy, changeSource),
    );

    car.change_history = car.change_history || [];
    car.change_history.push(...historyEntries);

    await car.save();
  }

  /**
   * Get car change history with optional filtering
   */
  static async getChangeHistory(
    carId: string,
    options?: {
      field?: string;
      source?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    },
  ): Promise<any[]> {
    const car = await Car.findOne({ car_id: carId }).select('change_history');
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    let history = car.change_history || [];

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
   * Get audit trail for car as formatted string
   */
  static async getAuditTrail(carId: string): Promise<string> {
    const car = await Car.findOne({ car_id: carId }).select('change_history');
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    const history = car.change_history || [];
    return ChangeHistoryTracker.auditTrail(history as any);
  }

  /**
   * Get comprehensive change summary
   */
  static async getChangeSummary(carId: string): Promise<{
    totalChanges: number;
    changedFields: string[];
    changedBy: string[];
    changeSources: string[];
    lastChange?: {
      field: string;
      changedAt: Date;
      changedBy: string;
    };
  }> {
    const car = await Car.findOne({ car_id: carId }).select('change_history');
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    const history = car.change_history || [];
    const summary = ChangeHistoryTracker.summarizeChanges(history as any);

    return {
      totalChanges: summary.totalChanges,
      changedFields: Array.from(summary.changedFields),
      changedBy: Array.from(summary.changedBy),
      changeSources: Array.from(summary.changeSources),
      lastChange: summary.latestChange
        ? {
          field: summary.latestChange.field,
          changedAt: summary.latestChange.changed_at,
          changedBy: summary.latestChange.changed_by,
        }
        : undefined,
    };
  }

  /**
   * Detect aggregation fields that need to be recomputed
   * Used to invalidate cache when relevant changes occur
   */
  static detectAggregationInvalidation(changes: Array<{ field: string }>): {
    needsAggregationRecompute: boolean;
    affectedAggregates: string[];
  } {
    const changedFields = new Set(changes.map((c) => c.field));

    const aggregateMap: Record<string, string[]> = {
      'aggregation:pricing': ['min_variant_price', 'max_variant_price', 'min_on_road_price', 'max_on_road_price'],
      'aggregation:powertrain': ['aggregated_fuel_types', 'aggregated_transmission_types', 'aggregated_drive_types'],
      'aggregation:performance': ['power_min_bhp', 'power_max_bhp', 'torque_min_nm', 'torque_max_nm'],
      'aggregation:features': [
        'sunroof_available',
        'adas_available',
        'ventilated_seats_available',
        'camera_360_available',
      ],
    };

    const affectedAggregates: string[] = [];

    for (const [aggregate, fields] of Object.entries(aggregateMap)) {
      if (fields.some((f) => changedFields.has(f))) {
        affectedAggregates.push(aggregate);
      }
    }

    return {
      needsAggregationRecompute: affectedAggregates.length > 0,
      affectedAggregates,
    };
  }
}
