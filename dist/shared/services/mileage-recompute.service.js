"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MileageRecomputeService = void 0;
const mileage_benchmarks_1 = require("../../constants/mileage-benchmarks");
const car_variant_model_1 = require("../../models/car-variant.model");
const car_model_1 = require("../../models/car.model");
const fuel_type_model_1 = require("../../models/fuel-type.model");
const mileage_classifier_service_1 = require("./mileage-classifier.service");
// Map fuel-type slug/name to a single display label used in `aggregated_fuel_types`.
// Spec: electric/BEV must render as "EV", not "Electric".
const fuelDisplayLabel = (name, slug) => {
    const key = (slug || name || '').toLowerCase();
    if (key === 'electric' || key === 'ev' || key === 'bev')
        return 'EV';
    return name || slug || '';
};
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
        // Build bulk operations for all variants
        const bulkOps = [];
        for (const variant of variants) {
            const result = await mileage_classifier_service_1.MileageClassifierService.classifyVariant(variant, parentCar);
            bulkOps.push({
                updateOne: {
                    filter: { _id: variant._id },
                    update: {
                        $set: {
                            mileage_class: result.mileage_class,
                            mileage_class_value: result.mileage_class_value,
                            mileage_class_source: result.mileage_class_source,
                            range_class: result.range_class,
                            range_class_value: result.range_class_value,
                            range_class_source: result.range_class_source,
                        }
                    }
                }
            });
        }
        // Execute all updates in one batch
        if (bulkOps.length > 0) {
            await car_variant_model_1.CarVariant.bulkWrite(bulkOps);
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
            .select('mileage_class mileage_class_value range_class range_class_value fuel_type_id ex_showroom_price expected_price transmission_type')
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
        let minPrice = null;
        let maxPrice = null;
        let incompleteCount = 0;
        const fuelIds = new Set();
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
            // Effective price: prefer ex_showroom_price (launched variants), fall back to expected_price (upcoming).
            const price = typeof v.ex_showroom_price === 'number' && v.ex_showroom_price > 0
                ? v.ex_showroom_price
                : typeof v.expected_price === 'number' && v.expected_price > 0
                    ? v.expected_price
                    : null;
            if (price != null) {
                minPrice = minPrice == null ? price : Math.min(minPrice, price);
                maxPrice = maxPrice == null ? price : Math.max(maxPrice, price);
            }
            if (v.fuel_type_id)
                fuelIds.add(v.fuel_type_id);
            // A variant is "incomplete" if a customer couldn't meaningfully shop it:
            // missing transmission, no price (ex_showroom or expected), or no fuel type.
            const hasPrice = price != null;
            const hasTransmission = typeof v.transmission_type === 'string' && v.transmission_type.length > 0;
            const hasFuel = typeof v.fuel_type_id === 'string' && v.fuel_type_id.length > 0;
            if (!hasPrice || !hasTransmission || !hasFuel) {
                incompleteCount++;
            }
        }
        // Resolve fuel-type IDs to display labels (applies "EV" mapping for electric).
        // De-dupe by label so a car with two "Electric" fuel-type rows still shows one "EV".
        let aggregatedFuelTypes = [];
        if (fuelIds.size > 0) {
            const fuelDocs = await fuel_type_model_1.FuelType.find({ fuel_type_id: { $in: Array.from(fuelIds) }, is_deleted: false })
                .select('fuel_type_id name slug')
                .lean();
            const labelSet = new Set();
            for (const f of fuelDocs) {
                const label = fuelDisplayLabel(f.name, f.slug);
                if (label)
                    labelSet.add(label);
            }
            aggregatedFuelTypes = Array.from(labelSet).sort();
        }
        await car_model_1.Car.updateOne({ car_id: carId }, {
            $set: {
                best_mileage_class: bestMileageClass,
                best_mileage_value: bestMileageValue,
                best_range_class: bestRangeClass,
                best_range_value: bestRangeValue,
                variant_count: variants.length,
                incomplete_variant_count: incompleteCount,
                min_variant_price: minPrice,
                max_variant_price: maxPrice,
                aggregated_fuel_types: aggregatedFuelTypes,
            },
        });
    }
}
exports.MileageRecomputeService = MileageRecomputeService;
