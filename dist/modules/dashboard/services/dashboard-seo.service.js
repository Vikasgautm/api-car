"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardSeoService = void 0;
const dbConnection_1 = require("../../../sql/utils/dbConnection");
class DashboardSeoService {
    static async getSummary() {
        const pool = await (0, dbConnection_1.getPool)();
        let statusCountsRes = { recordset: [] };
        let weakRes = { recordset: [{ count: 0 }] };
        let emptyRes = { recordset: [{ count: 0 }] };
        try {
            [statusCountsRes] = await Promise.all([
                pool.request().query('SELECT is_published, COUNT(*) as count FROM SeoCollections WHERE is_deleted = 0 GROUP BY is_published'),
            ]);
        }
        catch {
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
            }
            else {
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
exports.DashboardSeoService = DashboardSeoService;
