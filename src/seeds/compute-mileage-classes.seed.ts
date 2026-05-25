import { Car } from '../models/car.model';
import { CarVariant } from '../models/car-variant.model';
import { MileageRecomputeService } from '../shared/services/mileage-recompute.service';

/**
 * Backfill mileage / EV-range classifications for any car or variant that doesn't
 * yet have one. Runs on every server start but only touches rows that look unclassified,
 * so it's effectively a no-op once the data is healthy.
 */
export const computeMileageClassesIfNeeded = async () => {
  const unclassifiedVariantCount = await CarVariant.countDocuments({
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


  const cars = await Car.find({ is_deleted: false }).select('car_id').lean();

  let processed = 0;
  for (const car of cars) {
    await MileageRecomputeService.recomputeCar(car.car_id);
    processed++;
  }

};
