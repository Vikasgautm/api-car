"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeMileageClassesIfNeeded = void 0;
const car_model_1 = require("../models/car.model");
const car_variant_model_1 = require("../models/car-variant.model");
const mileage_recompute_service_1 = require("../shared/services/mileage-recompute.service");
/**
 * Backfill mileage / EV-range classifications for any car or variant that doesn't
 * yet have one. Runs on every server start but only touches rows that look unclassified,
 * so it's effectively a no-op once the data is healthy.
 */
const computeMileageClassesIfNeeded = async () => {
    const unclassifiedVariantCount = await car_variant_model_1.CarVariant.countDocuments({
        is_deleted: false,
        $and: [
            { mileage_class: { $in: [null, undefined] } },
            { range_class: { $in: [null, undefined] } },
            { mileage_class_value: { $in: [null, undefined] } },
            { range_class_value: { $in: [null, undefined] } },
        ],
    });
    if (unclassifiedVariantCount === 0) {
        return;
    }
    console.log(`Backfilling mileage/range classes for ${unclassifiedVariantCount} variant(s)...`);
    const cars = await car_model_1.Car.find({ is_deleted: false }).select('car_id').lean();
    let processed = 0;
    for (const car of cars) {
        await mileage_recompute_service_1.MileageRecomputeService.recomputeCar(car.car_id);
        processed++;
    }
    console.log(`Mileage class backfill complete (${processed} car(s) processed).`);
};
exports.computeMileageClassesIfNeeded = computeMileageClassesIfNeeded;
//# sourceMappingURL=compute-mileage-classes.seed.js.map