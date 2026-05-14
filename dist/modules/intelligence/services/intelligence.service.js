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
        return bodyTypes.map(bt => {
            const benchmarkKey = (0, mileage_benchmarks_1.resolveBenchmarkKey)(bt.slug || bt.name);
            const iceOverride = overrideByKey.get(`${bt.body_type_id}:ice`);
            const evOverride = overrideByKey.get(`${bt.body_type_id}:ev`);
            const iceDefault = benchmarkKey ? mileage_benchmarks_1.ICE_BENCHMARKS[benchmarkKey] ?? null : null;
            const evDefault = benchmarkKey ? mileage_benchmarks_1.EV_BENCHMARKS[benchmarkKey] ?? null : null;
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
        let variantsTouched = 0;
        for (const car of cars) {
            variantsTouched += await mileage_recompute_service_1.MileageRecomputeService.recomputeCar(car.car_id);
        }
        return { cars: cars.length, variants: variantsTouched };
    }
}
exports.IntelligenceService = IntelligenceService;
//# sourceMappingURL=intelligence.service.js.map