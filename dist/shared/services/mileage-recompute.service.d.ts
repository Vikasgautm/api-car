import { ICarVariant } from '../../models/car-variant.model';
export declare class MileageRecomputeService {
    /**
     * Reclassify a single variant in-place and persist the result.
     * `parentCar` may be passed when the caller already has it; otherwise we fetch it.
     * Returns the updated variant (or null if it could not be found/saved).
     */
    static recomputeVariant(variantId: string, parentCarOverride?: Pick<import('../../models/car.model').ICar, 'is_electric' | 'fuel_type_id' | 'body_type_id' | 'car_id'> | null): Promise<ICarVariant | null>;
    /**
     * Reclassify every non-deleted variant under a car and update the car's
     * aggregate fields. Returns the number of variants touched.
     */
    static recomputeCar(carId: string): Promise<number>;
    /**
     * Recompute just the parent car's aggregate fields from the current variant rows.
     * Cheaper than `recomputeCar` — call this after a single variant has already been
     * reclassified.
     */
    static recomputeCarAggregatesOnly(carId: string): Promise<void>;
}
