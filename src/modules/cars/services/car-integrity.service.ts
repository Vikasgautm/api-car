import { AppError } from '../../../shared/utils/app-error.util';
import { ChangeHistoryTracker } from '../../../shared/utils/change-history';
import { getPool, mssql } from '../../../sql/utils/dbConnection';

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
    const pool = await getPool();
    const result = await pool.request()
      .input('cid', mssql.NVarChar, carId)
      .query('SELECT change_history FROM Cars WHERE car_id = @cid');

    if (result.recordset.length === 0) {
      throw new AppError('Car not found', 404);
    }

    const changes = ChangeHistoryTracker.detectChanges(oldData, newData);

    if (changes.length === 0) return;

    const historyEntries = changes.map((c) =>
      ChangeHistoryTracker.createEntry(c.field, c.oldValue, c.newValue, changedBy, changeSource),
    );

    const oldHistoryStr = result.recordset[0].change_history;
    const oldHistory = oldHistoryStr ? JSON.parse(oldHistoryStr) : [];
    const newHistory = [...oldHistory, ...historyEntries];

    await pool.request()
      .input('cid', mssql.NVarChar, carId)
      .input('history', mssql.NVarChar, JSON.stringify(newHistory))
      .query('UPDATE Cars SET change_history = @history, updatedAt = GETDATE() WHERE car_id = @cid');
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
    const pool = await getPool();
    const result = await pool.request()
      .input('cid', mssql.NVarChar, carId)
      .query('SELECT change_history FROM Cars WHERE car_id = @cid');

    if (result.recordset.length === 0) {
      throw new AppError('Car not found', 404);
    }

    const historyStr = result.recordset[0].change_history;
    let history = historyStr ? JSON.parse(historyStr) : [];

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
    const history = await this.getChangeHistory(carId);
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
    const history = await this.getChangeHistory(carId);
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
