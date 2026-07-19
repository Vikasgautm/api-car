import { CarVariant } from '../../../models/car-variant.model';
import { Car } from '../../../models/car.model';
import { FuelType } from '../../../models/fuel-type.model';
import { Brand } from '../../../models/brand.model';
import { BodyType } from '../../../models/body-type.model';
import {
  BrandBodyBudgetResponse,
  BrandsResponse,
  BodyTypesResponse,
  BudgetResponse,
  FuelHealthIssue,
  FuelSummaryResponse,
  HealthResponse,
  LifecycleResponse,
  MultiFuelResponse,
  NestedBrand,
  SeatingResponse,
} from '../dtos/fuel-types-intelligence.dto';

// Only count variants that are active (published, not deleted, not archived)
const ACTIVE_MATCH = { is_published: true, is_deleted: false, is_archived: false };

// Centralised budget slabs — mirrors frontend shared/constants/budget-slabs.ts
const BUDGET_SLABS = [
  { label: 'Under 5L', min: 0, max: 500000 },
  { label: '5–10L', min: 500000, max: 1000000 },
  { label: '10–15L', min: 1000000, max: 1500000 },
  { label: '15–20L', min: 1500000, max: 2000000 },
  { label: '20–30L', min: 2000000, max: 3000000 },
  { label: '30–50L', min: 3000000, max: 5000000 },
  { label: '50L–1Cr', min: 5000000, max: 10000000 },
  { label: 'Above 1Cr', min: 10000000, max: null },
];

const SLAB_LABELS = BUDGET_SLABS.map((s) => s.label);

function getBudgetSlabLabel(price: number): string {
  if (!price || price <= 0) return 'Unpriced';
  for (const s of BUDGET_SLABS) {
    if (s.max !== null && price >= s.min && price < s.max) return s.label;
    if (s.max === null && price >= s.min) return s.label;
  }
  return 'Above 1Cr';
}

function now() {
  return new Date().toISOString();
}

export class FuelTypesIntelligenceService {
  static async getSummary(): Promise<FuelSummaryResponse> {
    const [fuelTypes, variants, cars] = await Promise.all([
      FuelType.find({ is_published: true, is_deleted: false }).select('fuel_type_id name slug').lean(),
      CarVariant.find(ACTIVE_MATCH as any).select('car_id fuel_type_id').lean(),
      Car.find({ is_deleted: false }).select('car_id brand_id').lean(),
    ]);

    if (!fuelTypes.length) {
      return { items: [], total_cars: 0, generated_at: now() };
    }

    const carBrandMap = new Map<string, string>();
    for (const c of cars) {
      if (c.car_id && c.brand_id) carBrandMap.set(c.car_id, c.brand_id);
    }

    const statsMap: Record<string, { car_ids: Set<string>; brand_ids: Set<string> }> = {};
    for (const v of variants) {
      if (!v.car_id || !v.fuel_type_id) continue;
      const brandId = carBrandMap.get(v.car_id);
      if (!brandId) continue;

      if (!statsMap[v.fuel_type_id]) {
        statsMap[v.fuel_type_id] = { car_ids: new Set(), brand_ids: new Set() };
      }
      statsMap[v.fuel_type_id].car_ids.add(v.car_id);
      statsMap[v.fuel_type_id].brand_ids.add(brandId);
    }

    const totalCars = Object.values(statsMap).reduce((sum, r) => sum + r.car_ids.size, 0);

    const items = fuelTypes.map((ft) => {
      const stats = statsMap[ft.fuel_type_id];
      const carCount = stats ? stats.car_ids.size : 0;
      const brandCount = stats ? stats.brand_ids.size : 0;
      return {
        fuel_type_id: ft.fuel_type_id,
        name: ft.name,
        slug: ft.slug,
        total_cars: carCount,
        total_brands: brandCount,
        inventory_pct: totalCars > 0 ? Math.round((carCount / totalCars) * 100 * 10) / 10 : 0,
      };
    });

    return { items, total_cars: totalCars, generated_at: now() };
  }

  static async getBrands(): Promise<BrandsResponse> {
    const [fuelTypes, brands, variants, cars] = await Promise.all([
      FuelType.find({ is_published: true, is_deleted: false }).select('fuel_type_id name slug').lean(),
      Brand.find({ is_deleted: false }).select('brand_id name slug').lean(),
      CarVariant.find(ACTIVE_MATCH as any).select('car_id fuel_type_id').lean(),
      Car.find({ is_deleted: false }).select('car_id brand_id').lean(),
    ]);

    const brandMap: Record<string, { name: string; slug: string }> = {};
    for (const b of brands) brandMap[b.brand_id] = { name: b.name, slug: b.slug };

    const fuelMap: Record<string, { name: string; slug: string }> = {};
    for (const ft of fuelTypes) fuelMap[ft.fuel_type_id] = { name: ft.name, slug: ft.slug };

    const carBrandMap = new Map<string, string>();
    for (const c of cars) {
      if (c.car_id && c.brand_id) carBrandMap.set(c.car_id, c.brand_id);
    }

    const brandFuelCars: Record<string, Record<string, Set<string>>> = {};

    for (const v of variants) {
      if (!v.car_id || !v.fuel_type_id) continue;
      const brandId = carBrandMap.get(v.car_id);
      if (!brandId) continue;

      if (!brandFuelCars[brandId]) brandFuelCars[brandId] = {};
      if (!brandFuelCars[brandId][v.fuel_type_id]) brandFuelCars[brandId][v.fuel_type_id] = new Set();
      brandFuelCars[brandId][v.fuel_type_id].add(v.car_id);
    }

    const rows = Object.entries(brandFuelCars)
      .map(([bid, fuelSets]) => {
        const fuels: Record<string, number> = {};
        let total = 0;
        for (const [fid, carSet] of Object.entries(fuelSets)) {
          const fslug = fuelMap[fid]?.slug ?? fid;
          fuels[fslug] = carSet.size;
          total += carSet.size;
        }
        return {
          brand_id: bid,
          brand_name: brandMap[bid]?.name ?? bid,
          brand_slug: brandMap[bid]?.slug ?? bid,
          fuels,
          total,
        };
      })
      .sort((a, b) => b.total - a.total);

    return {
      fuel_types: fuelTypes.map((ft) => ({ id: ft.fuel_type_id, name: ft.name, slug: ft.slug })),
      rows,
      generated_at: now(),
    };
  }

  static async getBodyTypes(): Promise<BodyTypesResponse> {
    const [fuelTypes, bodyTypes, variants, cars] = await Promise.all([
      FuelType.find({ is_published: true, is_deleted: false }).select('fuel_type_id name slug').lean(),
      BodyType.find({ is_deleted: false }).select('body_type_id name slug').lean(),
      CarVariant.find(ACTIVE_MATCH as any).select('car_id fuel_type_id').lean(),
      Car.find({ is_deleted: false }).select('car_id body_type_id').lean(),
    ]);

    const bodyMap: Record<string, { name: string; slug: string }> = {};
    for (const bt of bodyTypes) bodyMap[bt.body_type_id] = { name: bt.name, slug: bt.slug };

    const carBodyMap = new Map<string, string>();
    for (const c of cars) {
      if (c.car_id && c.body_type_id) carBodyMap.set(c.car_id, c.body_type_id);
    }

    const fuelBodyCars: Record<string, Record<string, Set<string>>> = {};

    for (const v of variants) {
      if (!v.car_id || !v.fuel_type_id) continue;
      const bodyTypeId = carBodyMap.get(v.car_id);
      if (!bodyTypeId) continue;

      if (!fuelBodyCars[v.fuel_type_id]) fuelBodyCars[v.fuel_type_id] = {};
      if (!fuelBodyCars[v.fuel_type_id][bodyTypeId]) fuelBodyCars[v.fuel_type_id][bodyTypeId] = new Set();
      fuelBodyCars[v.fuel_type_id][bodyTypeId].add(v.car_id);
    }

    const rows = fuelTypes.map((ft) => {
      const bodySets = fuelBodyCars[ft.fuel_type_id] || {};
      const body_types: Record<string, number> = {};
      for (const [btid, carSet] of Object.entries(bodySets)) {
        const bslug = bodyMap[btid]?.slug ?? btid;
        body_types[bslug] = carSet.size;
      }
      return {
        fuel_type_id: ft.fuel_type_id,
        fuel_name: ft.name,
        fuel_slug: ft.slug,
        body_types,
      };
    });

    return {
      body_type_list: bodyTypes.map((bt) => ({ id: bt.body_type_id, name: bt.name, slug: bt.slug })),
      rows,
      generated_at: now(),
    };
  }

  static async getBudget(): Promise<BudgetResponse> {
    const [fuelTypes, variants, cars] = await Promise.all([
      FuelType.find({ is_published: true, is_deleted: false }).select('fuel_type_id name slug').lean(),
      CarVariant.find(ACTIVE_MATCH as any).select('car_id fuel_type_id').lean(),
      Car.find({ is_deleted: false }).select('car_id min_variant_price ex_showroom_price').lean(),
    ]);

    const carPriceMap = new Map<string, number>();
    for (const c of cars) {
      const p = Number((c as any).min_variant_price || (c as any).ex_showroom_price || 0);
      if (p > 0) carPriceMap.set(c.car_id, p);
    }

    const fuelSlabCars: Record<string, Record<string, Set<string>>> = {};

    for (const v of variants) {
      if (!v.car_id || !v.fuel_type_id) continue;
      const price = carPriceMap.get(v.car_id);
      if (!price) continue;

      const slabLabel = getBudgetSlabLabel(price);
      if (slabLabel === 'Unpriced') continue;

      if (!fuelSlabCars[v.fuel_type_id]) fuelSlabCars[v.fuel_type_id] = {};
      if (!fuelSlabCars[v.fuel_type_id][slabLabel]) fuelSlabCars[v.fuel_type_id][slabLabel] = new Set();
      fuelSlabCars[v.fuel_type_id][slabLabel].add(v.car_id);
    }

    const items = fuelTypes.map((ft) => {
      const slabSets = fuelSlabCars[ft.fuel_type_id] || {};
      return {
        fuel_type_id: ft.fuel_type_id,
        fuel_name: ft.name,
        fuel_slug: ft.slug,
        slabs: SLAB_LABELS.map((label) => ({
          label,
          count: slabSets[label]?.size ?? 0,
        })),
      };
    });

    return { items, slab_labels: SLAB_LABELS, generated_at: now() };
  }

  static async getBrandBodyBudget(): Promise<BrandBodyBudgetResponse> {
    const [fuelTypes, brands, bodyTypes, variants, cars] = await Promise.all([
      FuelType.find({ is_published: true, is_deleted: false }).select('fuel_type_id name slug').lean(),
      Brand.find({ is_deleted: false }).select('brand_id name slug').lean(),
      BodyType.find({ is_deleted: false }).select('body_type_id name slug').lean(),
      CarVariant.find(ACTIVE_MATCH as any).select('car_id fuel_type_id').lean(),
      Car.find({ is_deleted: false }).select('car_id brand_id body_type_id min_variant_price ex_showroom_price').lean(),
    ]);

    const fuelMap: Record<string, { name: string; slug: string }> = {};
    for (const ft of fuelTypes) fuelMap[ft.fuel_type_id] = { name: ft.name, slug: ft.slug };
    const brandMap: Record<string, { name: string; slug: string }> = {};
    for (const b of brands) brandMap[b.brand_id] = { name: b.name, slug: b.slug };
    const bodyMap: Record<string, { name: string; slug: string }> = {};
    for (const bt of bodyTypes) bodyMap[bt.body_type_id] = { name: bt.name, slug: bt.slug };

    const carDocMap = new Map<string, { brand_id: string; body_type_id: string; price: number }>();
    for (const c of cars) {
      if (c.car_id && c.brand_id && c.body_type_id) {
        const p = Number((c as any).min_variant_price || (c as any).ex_showroom_price || 0);
        carDocMap.set(c.car_id, { brand_id: c.brand_id, body_type_id: c.body_type_id, price: p });
      }
    }

    type SlabSets = Record<string, Set<string>>;
    type BodyTree = Record<string, SlabSets>;
    type FuelTree = Record<string, BodyTree>;
    type BrandTree = Record<string, FuelTree>;

    const tree: BrandTree = {};

    for (const v of variants) {
      if (!v.car_id || !v.fuel_type_id) continue;
      const cdoc = carDocMap.get(v.car_id);
      if (!cdoc) continue;

      const slabLabel = getBudgetSlabLabel(cdoc.price);

      if (!tree[cdoc.brand_id]) tree[cdoc.brand_id] = {};
      if (!tree[cdoc.brand_id][v.fuel_type_id]) tree[cdoc.brand_id][v.fuel_type_id] = {};
      if (!tree[cdoc.brand_id][v.fuel_type_id][cdoc.body_type_id]) tree[cdoc.brand_id][v.fuel_type_id][cdoc.body_type_id] = {};
      if (!tree[cdoc.brand_id][v.fuel_type_id][cdoc.body_type_id][slabLabel]) {
        tree[cdoc.brand_id][v.fuel_type_id][cdoc.body_type_id][slabLabel] = new Set();
      }
      tree[cdoc.brand_id][v.fuel_type_id][cdoc.body_type_id][slabLabel].add(v.car_id);
    }

    const brandResults: NestedBrand[] = Object.entries(tree)
      .map(([bid, fuels]) => {
        let brandTotal = 0;
        const fuelEntries = Object.entries(fuels).map(([fid, bodies]) => {
          let fuelTotal = 0;
          const bodyEntries = Object.entries(bodies).map(([btid, slabMap]) => {
            const slabTotal = Object.values(slabMap).reduce((s, set) => s + set.size, 0);
            fuelTotal += slabTotal;
            return {
              body_type_slug: bodyMap[btid]?.slug ?? btid,
              body_type_name: bodyMap[btid]?.name ?? btid,
              slabs: SLAB_LABELS.map((l) => ({ label: l, count: slabMap[l]?.size ?? 0 })),
              total: slabTotal,
            };
          });
          brandTotal += fuelTotal;
          return {
            fuel_slug: fuelMap[fid]?.slug ?? fid,
            fuel_name: fuelMap[fid]?.name ?? fid,
            body_types: bodyEntries.sort((a, b) => b.total - a.total),
            total: fuelTotal,
          };
        });
        return {
          brand_id: bid,
          brand_name: brandMap[bid]?.name ?? bid,
          brand_slug: brandMap[bid]?.slug ?? bid,
          fuels: fuelEntries.sort((a, b) => b.total - a.total),
          total: brandTotal,
        };
      })
      .sort((a, b) => b.total - a.total);

    return { brands: brandResults, slab_labels: SLAB_LABELS, generated_at: now() };
  }

  static async getSeating(): Promise<SeatingResponse> {
    const [fuelTypes, variants] = await Promise.all([
      FuelType.find({ is_published: true, is_deleted: false }).select('fuel_type_id name slug').lean(),
      CarVariant.find(ACTIVE_MATCH as any).select('car_id fuel_type_id seating_capacity').lean(),
    ]);

    const allSeating = new Set<number>();
    const fuelSeatingCars: Record<string, Record<string, Set<string>>> = {};

    for (const v of variants) {
      if (!v.car_id || !v.fuel_type_id || !v.seating_capacity || v.seating_capacity <= 0) continue;
      const seat = v.seating_capacity;
      allSeating.add(seat);

      if (!fuelSeatingCars[v.fuel_type_id]) fuelSeatingCars[v.fuel_type_id] = {};
      if (!fuelSeatingCars[v.fuel_type_id][String(seat)]) fuelSeatingCars[v.fuel_type_id][String(seat)] = new Set();
      fuelSeatingCars[v.fuel_type_id][String(seat)].add(v.car_id);
    }

    const seatingCapacities = Array.from(allSeating).sort((a, b) => a - b);

    const rows = fuelTypes.map((ft) => {
      const seatSets = fuelSeatingCars[ft.fuel_type_id] || {};
      const seating: Record<string, number> = {};
      for (const [seatStr, carSet] of Object.entries(seatSets)) {
        seating[seatStr] = carSet.size;
      }
      return {
        fuel_type_id: ft.fuel_type_id,
        fuel_name: ft.name,
        fuel_slug: ft.slug,
        seating,
      };
    });

    return { seating_capacities: seatingCapacities, rows, generated_at: now() };
  }

  static async getLifecycle(): Promise<LifecycleResponse> {
    const [fuelTypes, variants, cars] = await Promise.all([
      FuelType.find({ is_published: true, is_deleted: false }).select('fuel_type_id name slug').lean(),
      CarVariant.find(ACTIVE_MATCH as any).select('car_id fuel_type_id').lean(),
      Car.find({ is_deleted: false }).select('car_id status entity_lifecycle_state').lean(),
    ]);

    const fuelMap: Record<string, { name: string; slug: string }> = {};
    for (const ft of fuelTypes) fuelMap[ft.fuel_type_id] = { name: ft.name, slug: ft.slug };

    const carLcMap = new Map<string, string>();
    for (const c of cars) {
      const lc = (c as any).entity_lifecycle_state || c.status || 'unknown';
      carLcMap.set(c.car_id, lc);
    }

    const lcFuelCars: Record<string, Record<string, Set<string>>> = {};

    for (const v of variants) {
      if (!v.car_id || !v.fuel_type_id) continue;
      const lc = carLcMap.get(v.car_id) || 'unknown';

      if (!lcFuelCars[lc]) lcFuelCars[lc] = {};
      if (!lcFuelCars[lc][v.fuel_type_id]) lcFuelCars[lc][v.fuel_type_id] = new Set();
      lcFuelCars[lc][v.fuel_type_id].add(v.car_id);
    }

    const rows = Object.entries(lcFuelCars).map(([lc, fuelSets]) => {
      const fuels: Record<string, number> = {};
      let total = 0;
      for (const [fid, carSet] of Object.entries(fuelSets)) {
        const fslug = fuelMap[fid]?.slug ?? fid;
        fuels[fslug] = carSet.size;
        total += carSet.size;
      }
      return {
        lifecycle: lc,
        fuels,
        total,
      };
    });

    return {
      fuel_types: fuelTypes.map((ft) => ({ id: ft.fuel_type_id, name: ft.name, slug: ft.slug })),
      rows,
      generated_at: now(),
    };
  }

  static async getHealth(): Promise<HealthResponse> {
    const issues: FuelHealthIssue[] = [];

    const [publishedCars, activeVariants, allPublishedCars] = await Promise.all([
      Car.find({ is_deleted: false, is_published: true }).select('car_id name slug is_upcoming').lean(),
      CarVariant.find(ACTIVE_MATCH as any).select('car_id variant_name fuel_type_id ex_showroom_price').lean(),
      Car.find({ is_deleted: false, is_published: true }).select('car_id name slug body_type_id').lean(),
    ]);

    const activeCarVariantMap = new Map<string, any[]>();
    for (const v of activeVariants) {
      if (!activeCarVariantMap.has(v.car_id)) activeCarVariantMap.set(v.car_id, []);
      activeCarVariantMap.get(v.car_id)!.push(v);
    }

    // 1. Published, non-deleted cars with no published active variants
    for (const c of publishedCars) {
      const vars = activeCarVariantMap.get(c.car_id) || [];
      if (vars.length === 0) {
        issues.push({
          car_id: c.car_id,
          car_name: c.name,
          car_slug: c.slug,
          issue: 'Published car has no active variants',
          issue_code: 'NO_ACTIVE_VARIANTS',
          severity: 'critical',
        });
      }
    }

    // 2. Variants with no fuel_type_id (active only)
    const variantsNoFuel = activeVariants.filter((v) => !v.fuel_type_id);
    const carDocMap = new Map<string, { name: string; slug: string }>();
    for (const c of publishedCars) carDocMap.set(c.car_id, { name: c.name, slug: c.slug });

    const seenNoFuel = new Set<string>();
    for (const v of variantsNoFuel) {
      if (seenNoFuel.has(v.car_id)) continue;
      seenNoFuel.add(v.car_id);
      const car = carDocMap.get(v.car_id);
      issues.push({
        car_id: v.car_id,
        car_name: car?.name ?? v.car_id,
        car_slug: car?.slug ?? v.car_id,
        issue: 'Active variant(s) missing fuel type assignment',
        issue_code: 'VARIANT_NO_FUEL_TYPE',
        severity: 'high',
      });
    }

    // 3. Cars missing body_type_id
    for (const c of allPublishedCars) {
      if (!c.body_type_id) {
        issues.push({
          car_id: c.car_id,
          car_name: c.name,
          car_slug: c.slug,
          issue: 'Published car missing body type',
          issue_code: 'NO_BODY_TYPE',
          severity: 'high',
        });
      }
    }

    // 4. Published non-upcoming cars with no price on any active variant
    for (const c of publishedCars) {
      if (c.is_upcoming) continue;
      const vars = activeCarVariantMap.get(c.car_id) || [];
      const hasPriced = vars.some((v) => Number(v.ex_showroom_price || 0) > 0);
      if (!hasPriced) {
        issues.push({
          car_id: c.car_id,
          car_name: c.name,
          car_slug: c.slug,
          issue: 'Launched car has no priced variants',
          issue_code: 'NO_PRICED_VARIANTS',
          severity: 'medium',
        });
      }
    }

    return { issues, total: issues.length, generated_at: now() };
  }

  static async getMultiFuel(): Promise<MultiFuelResponse> {
    const [brands, variants, cars] = await Promise.all([
      Brand.find({ is_deleted: false }).select('brand_id name slug').lean(),
      CarVariant.find(ACTIVE_MATCH as any).select('car_id fuel_type_id').lean(),
      Car.find({ is_deleted: false }).select('car_id brand_id').lean(),
    ]);

    const brandMap: Record<string, { name: string; slug: string }> = {};
    for (const b of brands) brandMap[b.brand_id] = { name: b.name, slug: b.slug };

    const carBrandMap = new Map<string, string>();
    for (const c of cars) {
      if (c.car_id && c.brand_id) carBrandMap.set(c.car_id, c.brand_id);
    }

    const carFuelMap = new Map<string, Set<string>>();
    for (const v of variants) {
      if (!v.car_id || !v.fuel_type_id) continue;
      if (!carFuelMap.has(v.car_id)) carFuelMap.set(v.car_id, new Set());
      carFuelMap.get(v.car_id)!.add(v.fuel_type_id);
    }

    const brandModelStats: Record<string, { total: number; multiFuel: number }> = {};

    for (const [carId, fuelSet] of carFuelMap.entries()) {
      const brandId = carBrandMap.get(carId);
      if (!brandId) continue;

      if (!brandModelStats[brandId]) brandModelStats[brandId] = { total: 0, multiFuel: 0 };
      brandModelStats[brandId].total += 1;
      if (fuelSet.size > 1) {
        brandModelStats[brandId].multiFuel += 1;
      }
    }

    let totalMultiFuelCars = 0;
    const rows = Object.entries(brandModelStats)
      .filter(([_, stats]) => stats.multiFuel > 0)
      .map(([bid, stats]) => {
        totalMultiFuelCars += stats.multiFuel;
        return {
          brand_id: bid,
          brand_name: brandMap[bid]?.name ?? bid,
          brand_slug: brandMap[bid]?.slug ?? bid,
          multi_fuel_models: stats.multiFuel,
          total_models: stats.total,
        };
      })
      .sort((a, b) => b.multi_fuel_models - a.multi_fuel_models);

    return { rows, total_multi_fuel_cars: totalMultiFuelCars, generated_at: now() };
  }
}
