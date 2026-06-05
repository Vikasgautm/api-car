"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligenceService = void 0;
const uuid_1 = require("uuid");
const mileage_benchmarks_1 = require("../../../constants/mileage-benchmarks");
const body_type_model_1 = require("../../../models/body-type.model");
const car_model_1 = require("../../../models/car.model");
const mileage_benchmark_override_model_1 = require("../../../models/mileage-benchmark-override.model");
const mileage_classifier_service_1 = require("../../../shared/services/mileage-classifier.service");
const mileage_recompute_service_1 = require("../../../shared/services/mileage-recompute.service");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
class IntelligenceService {
    /**
     * Return the full benchmark matrix: every published body type, ICE + EV, with
     * the active thresholds and where they came from (override vs constant default).
     */
    static async getBenchmarkMatrix() {
        const [bodyTypes, overrides] = await Promise.all([
            body_type_model_1.BodyType.find({ is_deleted: false }).select('body_type_id name slug').sort({ name: 1 }).lean(),
            mileage_benchmark_override_model_1.MileageBenchmarkOverride.find({}).lean(),
        ]);
        const overrideByKey = new Map();
        for (const ov of overrides) {
            overrideByKey.set(`${ov.body_type_id}:${ov.fuel_category}`, ov);
        }
        const resolveCell = (bodyTypeId, fuelCategory, defaultThresholds) => {
            const override = overrideByKey.get(`${bodyTypeId}:${fuelCategory}`);
            if (override)
                return { thresholds: override.thresholds, source: 'override', override_id: override.override_id };
            if (defaultThresholds)
                return { thresholds: defaultThresholds, source: 'default' };
            return { thresholds: null, source: 'none' };
        };
        return bodyTypes.map(bt => {
            const benchmarkKey = (0, mileage_benchmarks_1.resolveBenchmarkKey)(bt.slug || bt.name);
            const iceFuel = benchmarkKey ? mileage_benchmarks_1.ICE_FUEL_BENCHMARKS[benchmarkKey] : null;
            return {
                body_type_id: bt.body_type_id,
                body_type_name: bt.name,
                body_type_slug: bt.slug,
                benchmark_key: benchmarkKey,
                ice: resolveCell(bt.body_type_id, 'ice', benchmarkKey ? mileage_benchmarks_1.ICE_BENCHMARKS[benchmarkKey] ?? null : null),
                ev: resolveCell(bt.body_type_id, 'ev', benchmarkKey ? mileage_benchmarks_1.EV_BENCHMARKS[benchmarkKey] ?? null : null),
                petrol: resolveCell(bt.body_type_id, 'petrol', iceFuel?.petrol ?? null),
                diesel: resolveCell(bt.body_type_id, 'diesel', iceFuel?.diesel ?? null),
                cng: resolveCell(bt.body_type_id, 'cng', iceFuel?.cng ?? null),
                hybrid: resolveCell(bt.body_type_id, 'hybrid', iceFuel?.hybrid ?? null),
            };
        });
    }
    static async upsertOverride(bodyTypeId, fuelCategory, thresholds, actorUserId) {
        const bodyType = await body_type_model_1.BodyType.findOne({ body_type_id: bodyTypeId, is_deleted: false }).lean();
        if (!bodyType) {
            throw new app_error_util_1.AppError(`Body type not found: ${bodyTypeId}`, 404);
        }
        const existing = await mileage_benchmark_override_model_1.MileageBenchmarkOverride.findOne({
            body_type_id: bodyTypeId,
            fuel_category: fuelCategory,
        });
        let result;
        if (existing) {
            existing.thresholds = thresholds;
            existing.updated_by = actorUserId;
            await existing.save();
            result = existing;
        }
        else {
            result = await mileage_benchmark_override_model_1.MileageBenchmarkOverride.create({
                override_id: (0, uuid_1.v4)(),
                body_type_id: bodyTypeId,
                fuel_category: fuelCategory,
                thresholds,
                updated_by: actorUserId,
            });
        }
        mileage_classifier_service_1.MileageClassifierService.invalidateCache();
        return result;
    }
    static async deleteOverride(bodyTypeId, fuelCategory) {
        const result = await mileage_benchmark_override_model_1.MileageBenchmarkOverride.deleteOne({
            body_type_id: bodyTypeId,
            fuel_category: fuelCategory,
        });
        mileage_classifier_service_1.MileageClassifierService.invalidateCache();
        return result.deletedCount > 0;
    }
    /**
     * Reclassify every non-deleted variant. Useful after editing overrides or seeding
     * new body types. Runs car-by-car so progress is observable and aggregates stay
     * consistent. Returns counts of cars and variants touched.
     */
    static async reclassifyAll() {
        mileage_classifier_service_1.MileageClassifierService.invalidateCache();
        const cars = await car_model_1.Car.find({ is_deleted: false }).select('car_id').lean();
        // Parallelize recomputation across all cars instead of sequential processing
        const variantCounts = await Promise.all(cars.map(car => mileage_recompute_service_1.MileageRecomputeService.recomputeCar(car.car_id)));
        const variantsTouched = variantCounts.reduce((sum, count) => sum + count, 0);
        return { cars: cars.length, variants: variantsTouched };
    }
}
exports.IntelligenceService = IntelligenceService;
//# sourceMappingURL=intelligence.service.js.map