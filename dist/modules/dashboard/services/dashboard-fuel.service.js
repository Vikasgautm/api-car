"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardFuelService = void 0;
const car_variant_model_1 = require("../../../models/car-variant.model");
const fuel_type_model_1 = require("../../../models/fuel-type.model");
class DashboardFuelService {
    static async getSnapshot() {
        const [fuelGroups, fuelTypes] = await Promise.all([
            car_variant_model_1.CarVariant.aggregate([
                { $match: { is_deleted: false } },
                { $group: { _id: '$fuel_type_id', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            fuel_type_model_1.FuelType.find({ is_deleted: false }).select('fuel_type_id name').lean(),
        ]);
        const fuelMap = {};
        for (const ft of fuelTypes) {
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
        for (const g of fuelGroups) {
            const name = fuelMap[g._id] ?? '';
            if (g.count > strongestCount) {
                strongestCount = g.count;
                strongestId = name;
            }
            if (name.includes('petrol'))
                counts.petrol += g.count;
            else if (name.includes('diesel'))
                counts.diesel += g.count;
            else if (name.includes('electric') || name.includes('ev'))
                counts.electric += g.count;
            else if (name.includes('hybrid'))
                counts.hybrid += g.count;
            else if (name.includes('cng'))
                counts.cng += g.count;
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
//# sourceMappingURL=dashboard-fuel.service.js.map