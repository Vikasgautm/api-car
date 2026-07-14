import { getPool } from '../../../sql/utils/dbConnection';

export interface SeoSummary {
  total: number;
  published: number;
  draft: number;
  archived: number;
  weak: number;
  empty: number;
}

export class DashboardSeoService {
  static async getSummary(): Promise<SeoSummary> {
    const pool = await getPool();

    const [statusCountsRes, weakRes, emptyRes] = await Promise.all([
      pool.request().query('SELECT status, COUNT(*) as count FROM SeoCollections WHERE is_deleted = 0 GROUP BY status'),
      pool.request().query('SELECT COUNT(*) as count FROM SeoCollections WHERE is_deleted = 0 AND matched_car_count > 0 AND matched_car_count < 3'),
      pool.request().query('SELECT COUNT(*) as count FROM SeoCollections WHERE is_deleted = 0 AND matched_car_count = 0'),
    ]);

    const counts = { published: 0, draft: 0, archived: 0 };
    let total = 0;
    for (const row of statusCountsRes.recordset) {
      const key = row.status as keyof typeof counts;
      const count = row.count || 0;
      if (key in counts) counts[key] = count;
      total += count;
    }

    return {
      total,
      published: counts.published,
      draft: counts.draft,
      archived: counts.archived,
      weak: weakRes.recordset[0].count || 0,
      empty: emptyRes.recordset[0].count || 0,
    };
  }
}
