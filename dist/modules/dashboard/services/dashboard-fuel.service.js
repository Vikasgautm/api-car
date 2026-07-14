"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardFuelService = void 0;
const dbConnection_1 = require("../../../sql/utils/dbConnection");
class DashboardFuelService {
    static async getSnapshot() {
        const pool = await (0, dbConnection_1.getPool)();
        const [fuelGroupsResult, fuelTypesResult] = await Promise.all([
            pool.request().query('SELECT fuel_type_id, COUNT(*) as count FROM CarVariants WHERE is_deleted = 0 GROUP BY fuel_type_id'),
            pool.request().query('SELECT fuel_type_id, name FROM FuelTypes WHERE is_deleted = 0'),
        ]);
        const fuelMap = {};
        for (const ft of fuelTypesResult.recordset) {
            fuelMap[ft.fuel_type_id] = (ft.name || '').toLowerCase();
        }
        const counts = {
            petrol: 0,
            diesel: 0,
            electric: 0,
            hybrid: 0,
            cng: 0,
        };
        let strongestId = '';
        let strongestCount = 0;
        for (const g of fuelGroupsResult.recordset) {
            const name = fuelMap[g.fuel_type_id] ?? '';
            const count = g.count || 0;
            if (count > strongestCount) {
                strongestCount = count;
                strongestId = name;
            }
            if (name.includes('petrol'))
                counts.petrol += count;
            else if (name.includes('diesel'))
                counts.diesel += count;
            else if (name.includes('electric') || name.includes('ev'))
                counts.electric += count;
            else if (name.includes('hybrid'))
                counts.hybrid += count;
            else if (name.includes('cng'))
                counts.cng += count;
        }
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        return {
            petrol: counts.petrol,
            diesel: counts.diesel,
            electric: counts.electric,
            hybrid: counts.hybrid,
            cng: counts.cng,
            strongest_segment: strongestId || 'petrol',
            total_variants: total,
        };
    }
}
exports.DashboardFuelService = DashboardFuelService;
