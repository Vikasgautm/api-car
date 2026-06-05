import { v4 as uuidv4 } from 'uuid';
import {
  BenchmarkThresholds,
  EV_BENCHMARKS,
  FuelCategory,
  ICE_BENCHMARKS,
  ICE_FUEL_BENCHMARKS,
  resolveBenchmarkKey,
} from '../../../constants/mileage-benchmarks';
import { BodyType } from '../../../models/body-type.model';
import { Car } from '../../../models/car.model';
import {
  IMileageBenchmarkOverride,
  MileageBenchmarkOverride,
} from '../../../models/mileage-benchmark-override.model';
import { MileageClassifierService } from '../../../shared/services/mileage-classifier.service';
import { MileageRecomputeService } from '../../../shared/services/mileage-recompute.service';
import { AppError } from '../../../shared/utils/app-error.util';

export interface BenchmarkCell {
  thresholds: BenchmarkThresholds | null;
  source: 'override' | 'default' | 'none';
  override_id?: string;
}

export interface BenchmarkMatrixRow {
  body_type_id: string;
  body_type_name: string;
  body_type_slug: string;
  benchmark_key: string | null;
  ice: BenchmarkCell;
  ev: BenchmarkCell;
  petrol: BenchmarkCell;
  diesel: BenchmarkCell;
  cng: BenchmarkCell;
  hybrid: BenchmarkCell;
}

export class IntelligenceService {
  /**
   * Return the full benchmark matrix: every published body type, ICE + EV, with
   * the active thresholds and where they came from (override vs constant default).
   */
  static async getBenchmarkMatrix(): Promise<BenchmarkMatrixRow[]> {
    const [bodyTypes, overrides] = await Promise.all([
      BodyType.find({ is_deleted: false }).select('body_type_id name slug').sort({ name: 1 }).lean(),
      MileageBenchmarkOverride.find({}).lean(),
    ]);

    const overrideByKey = new Map<string, IMileageBenchmarkOverride>();
    for (const ov of overrides) {
      overrideByKey.set(`${ov.body_type_id}:${ov.fuel_category}`, ov as IMileageBenchmarkOverride);
    }

    const resolveCell = (
      bodyTypeId: string,
      fuelCategory: FuelCategory,
      defaultThresholds: BenchmarkThresholds | null | undefined,
    ): BenchmarkCell => {
      const override = overrideByKey.get(`${bodyTypeId}:${fuelCategory}`);
      if (override) return { thresholds: override.thresholds, source: 'override', override_id: override.override_id };
      if (defaultThresholds) return { thresholds: defaultThresholds, source: 'default' };
      return { thresholds: null, source: 'none' };
    };

    return bodyTypes.map(bt => {
      const benchmarkKey = resolveBenchmarkKey(bt.slug || bt.name);
      const iceFuel = benchmarkKey ? ICE_FUEL_BENCHMARKS[benchmarkKey] : null;

      return {
        body_type_id: bt.body_type_id,
        body_type_name: bt.name,
        body_type_slug: bt.slug,
        benchmark_key: benchmarkKey,
        ice:    resolveCell(bt.body_type_id, 'ice',    benchmarkKey ? ICE_BENCHMARKS[benchmarkKey] ?? null : null),
        ev:     resolveCell(bt.body_type_id, 'ev',     benchmarkKey ? EV_BENCHMARKS[benchmarkKey]  ?? null : null),
        petrol: resolveCell(bt.body_type_id, 'petrol', iceFuel?.petrol ?? null),
        diesel: resolveCell(bt.body_type_id, 'diesel', iceFuel?.diesel ?? null),
        cng:    resolveCell(bt.body_type_id, 'cng',    iceFuel?.cng    ?? null),
        hybrid: resolveCell(bt.body_type_id, 'hybrid', iceFuel?.hybrid ?? null),
      };
    });
  }

  static async upsertOverride(
    bodyTypeId: string,
    fuelCategory: FuelCategory,
    thresholds: BenchmarkThresholds,
    actorUserId?: string
  ): Promise<IMileageBenchmarkOverride> {
    const bodyType = await BodyType.findOne({ body_type_id: bodyTypeId, is_deleted: false }).lean();
    if (!bodyType) {
      throw new AppError(`Body type not found: ${bodyTypeId}`, 404);
    }

    const existing = await MileageBenchmarkOverride.findOne({
      body_type_id: bodyTypeId,
      fuel_category: fuelCategory,
    });

    let result: IMileageBenchmarkOverride;
    if (existing) {
      existing.thresholds = thresholds;
      existing.updated_by = actorUserId;
      await existing.save();
      result = existing;
    } else {
      result = await MileageBenchmarkOverride.create({
        override_id: uuidv4(),
        body_type_id: bodyTypeId,
        fuel_category: fuelCategory,
        thresholds,
        updated_by: actorUserId,
      });
    }

    MileageClassifierService.invalidateCache();
    return result;
  }

  static async deleteOverride(bodyTypeId: string, fuelCategory: FuelCategory): Promise<boolean> {
    const result = await MileageBenchmarkOverride.deleteOne({
      body_type_id: bodyTypeId,
      fuel_category: fuelCategory,
    });
    MileageClassifierService.invalidateCache();
    return result.deletedCount > 0;
  }

  /**
   * Reclassify every non-deleted variant. Useful after editing overrides or seeding
   * new body types. Runs car-by-car so progress is observable and aggregates stay
   * consistent. Returns counts of cars and variants touched.
   */
  static async reclassifyAll(): Promise<{ cars: number; variants: number }> {
    MileageClassifierService.invalidateCache();
    const cars = await Car.find({ is_deleted: false }).select('car_id').lean();

    // Parallelize recomputation across all cars instead of sequential processing
    const variantCounts = await Promise.all(
      cars.map(car => MileageRecomputeService.recomputeCar(car.car_id))
    );

    const variantsTouched = variantCounts.reduce((sum, count) => sum + count, 0);
    return { cars: cars.length, variants: variantsTouched };
  }
}
