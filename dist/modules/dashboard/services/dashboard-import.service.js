"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardImportService = void 0;
const import_log_model_1 = require("../../../models/import-log.model");
class DashboardImportService {
    static async getSummary() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [todayTotal, failed, saved, recentFailed] = await Promise.all([
            import_log_model_1.ImportLog.countDocuments({ createdAt: { $gte: today } }),
            import_log_model_1.ImportLog.countDocuments({ status: 'failed' }),
            import_log_model_1.ImportLog.countDocuments({ status: 'saved' }),
            import_log_model_1.ImportLog.find({ status: 'failed' })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('import_id source source_url error_messages createdAt')
                .lean(),
        ]);
        const recentFailedMapped = recentFailed.map((log) => ({
            import_id: log.import_id,
            source: log.source,
            source_url: log.source_url,
            error_messages: log.error_messages ?? [],
            created_at: log.createdAt,
        }));
        // Count imports with high unmatched keys as low confidence
        const lowConfidence = await import_log_model_1.ImportLog.countDocuments({
            status: 'saved',
            'unmatched_data': { $exists: true },
        });
        return {
            imports_today: todayTotal,
            failed_imports: failed,
            saved_imports: saved,
            low_confidence_imports: lowConfidence,
            unmapped_key_count: 0,
            recent_failed: recentFailedMapped,
        };
    }
}
exports.DashboardImportService = DashboardImportService;
