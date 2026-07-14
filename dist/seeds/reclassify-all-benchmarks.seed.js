"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Force-reclassifies ALL non-deleted variants with updated benchmark figures.
 * Run once after deploying benchmark constant changes.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/seeds/reclassify-all-benchmarks.seed.ts
 */
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("../config");
const car_model_1 = require("../models/car.model");
const car_variant_model_1 = require("../models/car-variant.model");
const mileage_classifier_service_1 = require("../shared/services/mileage-classifier.service");
const mileage_recompute_service_1 = require("../shared/services/mileage-recompute.service");
const logger_1 = require("../utils/logger");
async function run() {
    await mongoose_1.default.connect(config_1.config.mongodb_uri);
    logger_1.logger.info('Connected to MongoDB');
    mileage_classifier_service_1.MileageClassifierService.invalidateCache();
    const cars = await car_model_1.Car.find({ is_deleted: false }).select('car_id').lean();
    logger_1.logger.info(`Reclassifying variants across ${cars.length} cars…`);
    let totalVariants = 0;
    for (const car of cars) {
        const count = await mileage_recompute_service_1.MileageRecomputeService.recomputeCar(car.car_id);
        totalVariants += count;
    }
    // Validation: count variants with a classification
    const [iceCovered, evCovered, unclassified] = await Promise.all([
        car_variant_model_1.CarVariant.countDocuments({ is_deleted: false, mileage_class: { $ne: null } }),
        car_variant_model_1.CarVariant.countDocuments({ is_deleted: false, range_class: { $ne: null } }),
        car_variant_model_1.CarVariant.countDocuments({
            is_deleted: false,
            mileage_class: null,
            range_class: null,
        }),
    ]);
    const total = await car_variant_model_1.CarVariant.countDocuments({ is_deleted: false });
    logger_1.logger.info(`\nBenchmark reclassification complete`);
    logger_1.logger.info(`  Total variants      : ${total}`);
    logger_1.logger.info(`  ICE classified      : ${iceCovered}`);
    logger_1.logger.info(`  EV range classified : ${evCovered}`);
    logger_1.logger.info(`  Unclassified        : ${unclassified} (variants with no mileage/range data)`);
    logger_1.logger.info(`  Touched             : ${totalVariants}`);
    await mongoose_1.default.disconnect();
}
run().catch(err => {
    logger_1.logger.error('Reclassification failed:', err);
    process.exit(1);
});
