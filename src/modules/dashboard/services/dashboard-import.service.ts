import { ImportLog } from '../../../models/import-log.model';
import { ImportHealthSummary, RecentFailedImport } from '../dtos/dashboard.dto';

export class DashboardImportService {
  static async getSummary(): Promise<ImportHealthSummary> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayTotal, failed, saved, recentFailed] = await Promise.all([
      ImportLog.countDocuments({ createdAt: { $gte: today } }),
      ImportLog.countDocuments({ status: 'failed' }),
      ImportLog.countDocuments({ status: 'saved' }),
      ImportLog.find({ status: 'failed' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('import_id source source_url error_messages createdAt')
        .lean(),
    ]);

    const recentFailedMapped: RecentFailedImport[] = recentFailed.map((log) => ({
      import_id: log.import_id,
      source: log.source,
      source_url: log.source_url,
      error_messages: log.error_messages ?? [],
      created_at: log.createdAt,
    }));

    // Count imports with high unmatched keys as low confidence
    const lowConfidence = await ImportLog.countDocuments({
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
