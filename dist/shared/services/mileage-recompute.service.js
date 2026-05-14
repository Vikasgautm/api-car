"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MileageRecomputeService = void 0;
const mileage_benchmarks_1 = require("../../constants/mileage-benchmarks");
const car_variant_model_1 = require("../../models/car-variant.model");
const car_model_1 = require("../../models/car.model");
const mileage_classifier_service_1 = require("./mileage-classifier.service");
class MileageRecomputeService {
    /**
     * Reclassify a single variant in-place and persist the result.
     * `parentCar` may be passed when the caller already has it; otherwise we fetch it.
     * Returns the updated variant (or null if it could not be found/saved).
     */
    static async recomputeVariant(variantId, parentCarOverride) {
        const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: variantId, is_deleted: false });
        if (!variant)
            return null;
        const parentCar = parentCarOverride !== undefined
            ? parentCarOverride
            : await car_model_1.Car.findOne({ car_id: variant.car_id, is_deleted: false })
                .select('car_id is_electric fuel_type_id body_type_id')
                .lean();
        const result = await mileage_classifier_service_1.MileageClassifierService.classifyVariant(variant, parentCar ?? null);
        variant.mileage_class = result.mileage_class;
        variant.mileage_class_value = result.mileage_class_value;
        variant.mileage_class_source = result.mileage_class_source;
        variant.range_class = result.range_class;
        variant.range_class_value = result.range_class_value;
        variant.range_class_source = result.range_class_source;
        await variant.save();
        return variant;
    }
    /**
     * Reclassify every non-deleted variant under a car and update the car's
     * aggregate fields. Returns the number of variants touched.
     */
    static async recomputeCar(carId) {
        const parentCar = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false })
            .select('car_id is_electric fuel_type_id body_type_id')
            .lean();
        if (!parentCar)
            return 0;
        const variants = await car_variant_model_1.CarVariant.find({ car_id: carId, is_deleted: false });
        for (const variant of variants) {
            const result = await mileage_classifier_service_1.MileageClassifierService.classifyVariant(variant, parentCar);
            variant.mileage_class = result.mileage_class;
            variant.mileage_class_value = result.mileage_class_value;
            variant.mileage_class_source = result.mileage_class_source;
            variant.range_class = result.range_class;
            variant.range_class_value = result.range_class_value;
            variant.range_class_source = result.range_class_source;
            await variant.save();
        }
        await this.recomputeCarAggregatesOnly(carId);
        return variants.length;
    }
    /**
     * Recompute just the parent car's aggregate fields from the current variant rows.
     * Cheaper than `recomputeCar` — call this after a single variant has already been
     * reclassified.
     */
    static async recomputeCarAggregatesOnly(carId) {
        const variants = await car_variant_model_1.CarVariant.find({
            car_id: carId,
            is_deleted: false,
            is_archived: false,
        })
            .select('mileage_class mileage_class_value range_class range_class_value')
            .lean();
        const best = (a, b) => {
            if (!a)
                return b ?? null;
            if (!b)
                return a;
            return mileage_benchmarks_1.MILEAGE_CLASS_ORDER[a] >= mileage_benchmarks_1.MILEAGE_CLASS_ORDER[b] ? a : b;
        };
        let bestMileageClass = null;
        let bestMileageValue = null;
        let bestRangeClass = null;
        let bestRangeValue = null;
        for (const v of variants) {
            bestMileageClass = best(bestMileageClass, v.mileage_class);
            if (typeof v.mileage_class_value === 'number') {
                bestMileageValue = bestMileageValue == null
                    ? v.mileage_class_value
                    : Math.max(bestMileageValue, v.mileage_class_value);
            }
            bestRangeClass = best(bestRangeClass, v.range_class);
            if (typeof v.range_class_value === 'number') {
                bestRangeValue = bestRangeValue == null
                    ? v.range_class_value
                    : Math.max(bestRangeValue, v.range_class_value);
            }
        }
        await car_model_1.Car.updateOne({ car_id: carId }, {
            $set: {
                best_mileage_class: bestMileageClass,
                best_mileage_value: bestMileageValue,
                best_range_class: bestRangeClass,
                best_range_value: bestRangeValue,
            },
        });
    }
}
exports.MileageRecomputeService = MileageRecomputeService;
//# sourceMappingURL=mileage-recompute.service.js.map