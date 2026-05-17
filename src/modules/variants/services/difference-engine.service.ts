import { CarVariant } from '../../../models/car-variant.model';
import { Car } from '../../../models/car.model';

export interface VariantDifference {
  variant_id: string;
  adds_over_lower_variant?: string[]; // Features this variant has that the cheaper one doesn't
  missing_from_higher_variant?: string[]; // Features the more expensive variant has that this doesn't
}

export class DifferenceEngineService {
  /**
   * For a given variant, calculate what features it adds compared to the next cheaper variant,
   * and what features it's missing compared to the next more expensive variant.
   *
   * Only considers variants of the same car model for comparison.
   */
  static async calculateVariantDifference(variantId: string): Promise<VariantDifference> {
    const variant = await CarVariant.findOne({ variant_id: variantId }).populate('car_id').lean();
    if (!variant) throw new Error(`Variant not found: ${variantId}`);

    // Get all variants of the same car, sorted by price
    const carVariants = await CarVariant.find({
      car_id: variant.car_id,
      is_deleted: false,
      is_published: true,
    })
      .sort({ ex_showroom_price: 1 })
      .lean();

    const variantIndex = carVariants.findIndex(v => v.variant_id === variantId);
    const lowerVariant = variantIndex > 0 ? carVariants[variantIndex - 1] : null;
    const higherVariant = variantIndex < carVariants.length - 1 ? carVariants[variantIndex + 1] : null;

    const addsOverLower = lowerVariant ? this.getFeatureDifferences(lowerVariant, variant) : [];
    const missingFromHigher = higherVariant ? this.getFeatureDifferences(variant, higherVariant) : [];

    return {
      variant_id: variantId,
      adds_over_lower_variant: addsOverLower.length > 0 ? addsOverLower : undefined,
      missing_from_higher_variant: missingFromHigher.length > 0 ? missingFromHigher : undefined,
    };
  }

  /**
   * Compare two variants and return features that are in variant B but not in variant A.
   */
  private static getFeatureDifferences(variantA: any, variantB: any): string[] {
    const differences: string[] = [];
    const specsA = variantA.specs_normalized || {};
    const specsB = variantB.specs_normalized || {};

    // List of premium/significant features to track
    const featurePaths = [
      { path: 'infotainment_connectivity.touchscreen', label: 'Touchscreen' },
      { path: 'infotainment_connectivity.android_auto', label: 'Android Auto' },
      { path: 'infotainment_connectivity.apple_carplay', label: 'Apple CarPlay' },
      { path: 'infotainment_connectivity.navigation', label: 'Navigation' },
      { path: 'infotainment_connectivity.wireless_charging', label: 'Wireless Charging' },
      { path: 'comfort_convenience.ventilated_seats', label: 'Ventilated Seats' },
      { path: 'comfort_convenience.heated_seats', label: 'Heated Seats' },
      { path: 'comfort_convenience.cruise_control', label: 'Cruise Control' },
      { path: 'comfort_convenience.keyless_entry', label: 'Keyless Entry' },
      { path: 'comfort_convenience.push_button_start', label: 'Push Button Start' },
      { path: 'comfort_convenience.automatic_climate_control', label: 'Automatic Climate Control' },
      { path: 'interior.sunroof', label: 'Sunroof' },
      { path: 'interior.panoramic_sunroof', label: 'Panoramic Sunroof' },
      { path: 'interior.ambient_lighting', label: 'Ambient Lighting' },
      { path: 'safety.camera_360', label: '360° Camera' },
      { path: 'safety.parking_sensors', label: 'Parking Sensors' },
      { path: 'safety.rear_camera', label: 'Rear Camera' },
      { path: 'adas', label: 'ADAS System' }, // Check if any ADAS feature exists
      { path: 'connected_car', label: 'Connected Car' }, // Check if any connected car feature exists
      { path: 'exterior.led_headlights', label: 'LED Headlights' },
      { path: 'exterior.led_tail_lights', label: 'LED Tail Lights' },
      { path: 'exterior.drl', label: 'DRL' },
      { path: 'tyres_wheels.alloy_wheels', label: 'Alloy Wheels' },
    ];

    for (const feature of featurePaths) {
      const valueA = this.getNestedValue(specsA, feature.path);
      const valueB = this.getNestedValue(specsB, feature.path);

      const hasA = this.isFeaturePresent(valueA);
      const hasB = this.isFeaturePresent(valueB);

      // If B has the feature but A doesn't, add to differences
      if (hasB && !hasA) {
        differences.push(feature.label);
      }
    }

    return differences;
  }

  /**
   * Check if a feature value indicates the feature is present.
   */
  private static isFeaturePresent(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lowerVal = value.toLowerCase();
      return lowerVal !== 'no' && lowerVal !== 'none' && lowerVal !== '' && lowerVal !== 'false';
    }
    if (typeof value === 'object') {
      // For nested objects like ADAS or ConnectedCar, check if any field is truthy
      return Object.values(value).some(v => this.isFeaturePresent(v));
    }
    return !!value;
  }

  /**
   * Get nested value from object using dot notation.
   */
  private static getNestedValue(obj: any, path: string): any {
    if (!obj) return undefined;
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current && typeof current === 'object') {
        current = current[key];
      } else {
        return undefined;
      }
    }
    return current;
  }

  /**
   * Batch calculate differences for all variants of a car model.
   */
  static async calculateCarVariantDifferences(carId: string): Promise<VariantDifference[]> {
    const variants = await CarVariant.find({ car_id: carId, is_deleted: false, is_published: true }).lean();
    const results: VariantDifference[] = [];

    for (const variant of variants) {
      try {
        const diff = await this.calculateVariantDifference(variant.variant_id);
        results.push(diff);
      } catch (err) {
        console.error(`Failed to calculate difference for variant ${variant.variant_id}:`, err);
      }
    }

    return results;
  }
}
