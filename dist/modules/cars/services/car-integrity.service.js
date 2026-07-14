"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarIntegrityService = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const change_history_1 = require("../../../shared/utils/change-history");
const dbConnection_1 = require("../../../sql/utils/dbConnection");
class CarIntegrityService {
    /**
     * Track changes to car (Batch 6 Feature 2)
     * Records what changed, who changed it, when, and why
     */
    static async recordCarChanges(carId, oldData, newData, changedBy, changeSource = 'manual_edit') {
        const pool = await (0, dbConnection_1.getPool)();
        const result = await pool.request()
            .input('cid', dbConnection_1.mssql.NVarChar, carId)
            .query('SELECT change_history FROM Cars WHERE car_id = @cid');
        if (result.recordset.length === 0) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        const changes = change_history_1.ChangeHistoryTracker.detectChanges(oldData, newData);
        if (changes.length === 0)
            return;
        const historyEntries = changes.map((c) => change_history_1.ChangeHistoryTracker.createEntry(c.field, c.oldValue, c.newValue, changedBy, changeSource));
        const oldHistoryStr = result.recordset[0].change_history;
        const oldHistory = oldHistoryStr ? JSON.parse(oldHistoryStr) : [];
        const newHistory = [...oldHistory, ...historyEntries];
        await pool.request()
            .input('cid', dbConnection_1.mssql.NVarChar, carId)
            .input('history', dbConnection_1.mssql.NVarChar, JSON.stringify(newHistory))
            .query('UPDATE Cars SET change_history = @history, updatedAt = GETDATE() WHERE car_id = @cid');
    }
    /**
     * Get car change history with optional filtering
     */
    static async getChangeHistory(carId, options) {
        const pool = await (0, dbConnection_1.getPool)();
        const result = await pool.request()
            .input('cid', dbConnection_1.mssql.NVarChar, carId)
            .query('SELECT change_history FROM Cars WHERE car_id = @cid');
        if (result.recordset.length === 0) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        const historyStr = result.recordset[0].change_history;
        let history = historyStr ? JSON.parse(historyStr) : [];
        if (options?.field) {
            history = change_history_1.ChangeHistoryTracker.filterChangesByField(history, options.field);
        }
        if (options?.source) {
            history = change_history_1.ChangeHistoryTracker.filterChangesBySource(history, options.source);
        }
        if (options?.startDate && options?.endDate) {
            history = change_history_1.ChangeHistoryTracker.filterChangesByDateRange(history, options.startDate, options.endDate);
        }
        if (options?.limit) {
            history = history.slice(-options.limit);
        }
        return history;
    }
    /**
     * Get audit trail for car as formatted string
     */
    static async getAuditTrail(carId) {
        const history = await this.getChangeHistory(carId);
        return change_history_1.ChangeHistoryTracker.auditTrail(history);
    }
    /**
     * Get comprehensive change summary
     */
    static async getChangeSummary(carId) {
        const history = await this.getChangeHistory(carId);
        const summary = change_history_1.ChangeHistoryTracker.summarizeChanges(history);
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
    static detectAggregationInvalidation(changes) {
        const changedFields = new Set(changes.map((c) => c.field));
        const aggregateMap = {
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
        const affectedAggregates = [];
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
exports.CarIntegrityService = CarIntegrityService;
