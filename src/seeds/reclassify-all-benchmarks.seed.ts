/**
 * Force-reclassifies ALL non-deleted variants with updated benchmark figures.
 * Run once after deploying benchmark constant changes.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/seeds/reclassify-all-benchmarks.seed.ts
 */
import mongoose from 'mongoose';
import { config } from '../config';
import { Car } from '../models/car.model';
import { CarVariant } from '../models/car-variant.model';
import { MileageClassifierService } from '../shared/services/mileage-classifier.service';
import { MileageRecomputeService } from '../shared/services/mileage-recompute.service';
import { logger } from '../utils/logger';

async function run() {
  await mongoose.connect(config.mongodb_uri);
  logger.info('Connected to MongoDB');

  MileageClassifierService.invalidateCache();

  const cars = await Car.find({ is_deleted: false }).select('car_id').lean();
  logger.info(`Reclassifying variants across ${cars.length} cars…`);

  let totalVariants = 0;
  for (const car of cars) {
    const count = await MileageRecomputeService.recomputeCar(car.car_id);
    totalVariants += count;
  }

  // Validation: count variants with a classification
  const [iceCovered, evCovered, unclassified] = await Promise.all([
    CarVariant.countDocuments({ is_deleted: false, mileage_class: { $ne: null } }),
    CarVariant.countDocuments({ is_deleted: false, range_class: { $ne: null } }),
    CarVariant.countDocuments({
      is_deleted: false,
      mileage_class: null,
      range_class: null,
    }),
  ]);

  const total = await CarVariant.countDocuments({ is_deleted: false });
  logger.info(`\nBenchmark reclassification complete`);
  logger.info(`  Total variants      : ${total}`);
  logger.info(`  ICE classified      : ${iceCovered}`);
  logger.info(`  EV range classified : ${evCovered}`);
  logger.info(`  Unclassified        : ${unclassified} (variants with no mileage/range data)`);
  logger.info(`  Touched             : ${totalVariants}`);

  await mongoose.disconnect();
}

run().catch(err => {
  logger.error('Reclassification failed:', err);
  process.exit(1);
});
