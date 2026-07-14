import { ImportLog } from '../../../models/import-log.model';
import { getPool } from '../../../sql/utils/dbConnection';

export interface DashboardOverview {
  cars: {
    total: number;
    published: number;
    draft: number;
    upcoming: number;
    archived: number;
    discontinued: number;
  };
  total_variants: number;
  total_seo_collections: number;
  failed_imports: number;
  pending_ai_refinements: number;
  content_health_issues: number;
}

export class DashboardOverviewService {
  static async getOverview(): Promise<DashboardOverview> {
    const pool = await getPool();

    const [carStatsResult, totalVariantsResult, totalSeoCollectionsResult, failedImports] = await Promise.all([
      pool.request().query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) as published,
          SUM(CASE WHEN is_upcoming = 1 THEN 1 ELSE 0 END) as upcoming,
          SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived,
          SUM(CASE WHEN status = 'discontinued' THEN 1 ELSE 0 END) as discontinued
        FROM Cars
        WHERE is_deleted = 0
      `),
      pool.request().query('SELECT COUNT(*) as cnt FROM CarVariants WHERE is_deleted = 0'),
      pool.request().query('SELECT COUNT(*) as cnt FROM SeoCollections WHERE is_deleted = 0'),
      ImportLog.countDocuments({ status: 'failed' }),
    ]);

    const stats = carStatsResult.recordset[0] ?? { total: 0, published: 0, upcoming: 0, archived: 0, discontinued: 0 };
    const total = stats.total || 0;
    const published = stats.published || 0;
    const upcoming = stats.upcoming || 0;
    const archived = stats.archived || 0;
    const discontinued = stats.discontinued || 0;
    const draft = total - published - upcoming - archived - discontinued;

    const totalVariants = totalVariantsResult.recordset[0].cnt || 0;
    const totalSeoCollections = totalSeoCollectionsResult.recordset[0].cnt || 0;

    return {
      cars: {
        total,
        published,
        draft: Math.max(0, draft),
        upcoming,
        archived,
        discontinued,
      },
      total_variants: totalVariants,
      total_seo_collections: totalSeoCollections,
      failed_imports: failedImports,
      pending_ai_refinements: 0,
      content_health_issues: 0,
    };
  }
}
