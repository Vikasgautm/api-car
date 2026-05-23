import { CarVariant } from '../../../models/car-variant.model';
import { FuelType } from '../../../models/fuel-type.model';
import { FuelSnapshot } from '../dtos/dashboard.dto';

export class DashboardFuelService {
  static async getSnapshot(): Promise<FuelSnapshot> {
    const [fuelGroups, fuelTypes] = await Promise.all([
      CarVariant.aggregate([
        { $match: { is_deleted: false } },
        { $group: { _id: '$fuel_type_id', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      FuelType.find({ is_deleted: false }).select('fuel_type_id name').lean(),
    ]);

    const fuelMap: Record<string, string> = {};
    for (const ft of fuelTypes as any[]) {
      fuelMap[ft.fuel_type_id] = (ft.name || '').toLowerCase();
    }

    const counts: Record<string, number> = {
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
      if (g.count > strongestCount) { strongestCount = g.count; strongestId = name; }
      if (name.includes('petrol')) counts.petrol += g.count;
      else if (name.includes('diesel')) counts.diesel += g.count;
      else if (name.includes('electric') || name.includes('ev')) counts.electric += g.count;
      else if (name.includes('hybrid')) counts.hybrid += g.count;
      else if (name.includes('cng')) counts.cng += g.count;
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
