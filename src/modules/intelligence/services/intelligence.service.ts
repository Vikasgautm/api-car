import { v4 as uuidv4 } from 'uuid';
import {
  BenchmarkThresholds,
  EV_BENCHMARKS,
  FuelCategory,
  ICE_BENCHMARKS,
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

export interface BenchmarkMatrixRow {
  body_type_id: string;
  body_type_name: string;
  body_type_slug: string;
  benchmark_key: string | null;
  ice: {
    thresholds: BenchmarkThresholds | null;
    source: 'override' | 'default' | 'none';
    override_id?: string;
  };
  ev: {
    thresholds: BenchmarkThresholds | null;
    source: 'override' | 'default' | 'none';
    override_id?: string;
  };
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

    return bodyTypes.map(bt => {
      const benchmarkKey = resolveBenchmarkKey(bt.slug || bt.name);
      const iceOverride = overrideByKey.get(`${bt.body_type_id}:ice`);
      const evOverride = overrideByKey.get(`${bt.body_type_id}:ev`);

      const iceDefault = benchmarkKey ? ICE_BENCHMARKS[benchmarkKey] ?? null : null;
      const evDefault = benchmarkKey ? EV_BENCHMARKS[benchmarkKey] ?? null : null;

      return {
        body_type_id: bt.body_type_id,
        body_type_name: bt.name,
        body_type_slug: bt.slug,
        benchmark_key: benchmarkKey,
        ice: iceOverride
          ? { thresholds: iceOverride.thresholds, source: 'override', override_id: iceOverride.override_id }
          : iceDefault
            ? { thresholds: iceDefault, source: 'default' }
            : { thresholds: null, source: 'none' },
        ev: evOverride
          ? { thresholds: evOverride.thresholds, source: 'override', override_id: evOverride.override_id }
          : evDefault
            ? { thresholds: evDefault, source: 'default' }
            : { thresholds: null, source: 'none' },
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
