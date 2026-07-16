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

    let statusCountsRes = { recordset: [] as any[] };
    let weakRes = { recordset: [{ count: 0 }] };
    let emptyRes = { recordset: [{ count: 0 }] };

    try {
      [statusCountsRes] = await Promise.all([
        pool.request().query('SELECT is_published, COUNT(*) as count FROM SeoCollections WHERE is_deleted = 0 GROUP BY is_published'),
      ]);
    } catch {
      // In case table or query fails, default to empty
    }

    let published = 0;
    let draft = 0;
    let total = 0;

    for (const row of statusCountsRes.recordset) {
      const isPublished = row.is_published === 1 || row.is_published === true;
      const count = Number(row.count || 0);
      if (isPublished) {
        published += count;
      } else {
        draft += count;
      }
      total += count;
    }

    return {
      total,
      published,
      draft,
      archived: 0,
      weak: weakRes.recordset[0]?.count || 0,
      empty: emptyRes.recordset[0]?.count || 0,
    };
  }
}
