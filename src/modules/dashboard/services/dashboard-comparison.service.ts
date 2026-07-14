import { getPool, mssql } from '../../../sql/utils/dbConnection';

export interface ComparisonSummary {
  total: number;
  published: number;
  draft: number;
  cars_without_comparisons: number;
  recent_updated: number;
}

export class DashboardComparisonService {
  static async getSummary(): Promise<ComparisonSummary> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const pool = await getPool();

    const [statusCountsRes, recentUpdatedRes, totalCarsRes, carsInComparisonsRes] = await Promise.all([
      pool.request().query('SELECT status, COUNT(*) as count FROM Comparisons WHERE is_deleted = 0 GROUP BY status'),
      pool.request().input('sevenDaysAgo', mssql.DateTime, sevenDaysAgo).query('SELECT COUNT(*) as count FROM Comparisons WHERE is_deleted = 0 AND updated_at >= @sevenDaysAgo'),
      pool.request().query('SELECT COUNT(*) as count FROM Cars WHERE is_deleted = 0'),
      pool.request().query('SELECT DISTINCT car1_id FROM Comparisons WHERE is_deleted = 0'),
    ]);

    const counts = { published: 0, draft: 0, archived: 0 };
    let total = 0;
    for (const row of statusCountsRes.recordset) {
      const key = row.status as keyof typeof counts;
      const count = row.count || 0;
      if (key in counts) counts[key] = count;
      total += count;
    }

    const totalCars = totalCarsRes.recordset[0].count || 0;
    const carsWithComparisons = carsInComparisonsRes.recordset.length;
    const carsWithoutComparisons = Math.max(0, totalCars - carsWithComparisons);

    return {
      total,
      published: counts.published,
      draft: counts.draft,
      cars_without_comparisons: carsWithoutComparisons,
      recent_updated: recentUpdatedRes.recordset[0].count || 0,
    };
  }
}
