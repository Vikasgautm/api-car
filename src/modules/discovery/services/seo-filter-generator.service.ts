import { CarVariant } from '../../../models/car-variant.model';
import { SeoPreset } from '../../../models/seo-preset.model';
import { DiscoveryFilters } from './discovery.service';
import { SeoPresetService } from './seo-preset.service';

export interface FeatureAvailability {
  feature_key: string;
  feature_label: string;
  variant_count: number;
  car_count: number;
  brand_count: number;
  slug: string;
  suggested_title: string;
  suggested_h1: string;
  suggested_meta_description: string;
}

export class SeoFilterGeneratorService {
  /**
   * Scan all published variants and collect feature availability statistics.
   * Returns a list of all detected features with their popularity.
   */
  static async generateFeatureAvailability(): Promise<FeatureAvailability[]> {
    // All feature fields we track for SEO filters
    const featureFields = [
      { key: 'ventilated_seats', label: 'Ventilated Seats', path: 'specs_normalized.comfort_convenience.ventilated_seats' },
      { key: 'sunroof', label: 'Sunroof', path: 'specs_normalized.interior.sunroof' },
      { key: 'panoramic_sunroof', label: 'Panoramic Sunroof', path: 'specs_normalized.interior.panoramic_sunroof' },
      { key: 'camera_360', label: '360° Camera', path: 'specs_normalized.safety.camera_360' },
      { key: 'adas', label: 'ADAS', path: 'specs_normalized.adas' },
      { key: 'wireless_charger', label: 'Wireless Charger', path: 'specs_normalized.infotainment_connectivity.wireless_charging' },
      { key: 'connected_car', label: 'Connected Car', path: 'specs_normalized.connected_car' },
      { key: 'abs', label: 'ABS', path: 'specs_normalized.safety.abs' },
      { key: 'esp', label: 'Electronic Stability Program', path: 'specs_normalized.safety.esp' },
      { key: 'airbags', label: 'Airbags', path: 'specs_normalized.safety.airbags' },
      { key: 'parking_sensors', label: 'Parking Sensors', path: 'specs_normalized.safety.parking_sensors' },
      { key: 'rear_camera', label: 'Rear Camera', path: 'specs_normalized.safety.rear_camera' },
      { key: 'cruise_control', label: 'Cruise Control', path: 'specs_normalized.comfort_convenience.cruise_control' },
      { key: 'keyless_entry', label: 'Keyless Entry', path: 'specs_normalized.comfort_convenience.keyless_entry' },
      { key: 'push_button_start', label: 'Push Button Start', path: 'specs_normalized.comfort_convenience.push_button_start' },
      { key: 'automatic_climate_control', label: 'Automatic Climate Control', path: 'specs_normalized.comfort_convenience.automatic_climate_control' },
      { key: 'heated_seats', label: 'Heated Seats', path: 'specs_normalized.comfort_convenience.heated_seats' },
      { key: 'power_windows', label: 'Power Windows', path: 'specs_normalized.comfort_convenience.power_windows' },
      { key: 'leather_seats', label: 'Leather Seats', path: 'specs_normalized.comfort_convenience.seat_material' },
      { key: 'touchscreen', label: 'Touchscreen Infotainment', path: 'specs_normalized.infotainment_connectivity.touchscreen' },
      { key: 'android_auto', label: 'Android Auto', path: 'specs_normalized.infotainment_connectivity.android_auto' },
      { key: 'apple_carplay', label: 'Apple CarPlay', path: 'specs_normalized.infotainment_connectivity.apple_carplay' },
      { key: 'bluetooth', label: 'Bluetooth', path: 'specs_normalized.infotainment_connectivity.bluetooth' },
      { key: 'navigation', label: 'Navigation', path: 'specs_normalized.infotainment_connectivity.navigation' },
      { key: 'ota_updates', label: 'OTA Updates', path: 'specs_normalized.infotainment_connectivity.ota_updates' },
      { key: 'led_headlights', label: 'LED Headlights', path: 'specs_normalized.exterior.led_headlights' },
      { key: 'led_tail_lights', label: 'LED Tail Lights', path: 'specs_normalized.exterior.led_tail_lights' },
      { key: 'drl', label: 'DRL', path: 'specs_normalized.exterior.drl' },
      { key: 'alloy_wheels', label: 'Alloy Wheels', path: 'specs_normalized.tyres_wheels.alloy_wheels' },
      { key: 'isofix', label: 'ISOFIX', path: 'specs_normalized.safety.isofix' },
    ];

    const results: Map<string, { variants: Set<string>; cars: Set<string>; brands: Set<string> }> = new Map();

    // Scan all published variants
    const variants = await CarVariant.find({ is_published: true, is_deleted: false })
      .populate('car_id')
      .lean();

    for (const variant of variants) {
      for (const field of featureFields) {
        const value = this.getNestedValue(variant.specs_normalized, field.path.replace('specs_normalized.', ''));

        // Consider a feature "present" if it's truthy, non-empty, or "yes"
        if (value === true || value === 'yes' || (value && typeof value === 'string' && value.toLowerCase() !== 'no')) {
          if (!results.has(field.key)) {
            results.set(field.key, { variants: new Set(), cars: new Set(), brands: new Set() });
          }

          const stat = results.get(field.key)!;
          stat.variants.add(variant.variant_id);
          if (variant.car_id) {
            const carId = (variant.car_id as any)._id?.toString() || variant.car_id.toString();
            stat.cars.add(carId);
            stat.brands.add((variant.car_id as any).brand_id?.toString() || '');
          }
        }
      }
    }

    // Convert to output format, sorted by variant count
    const output: FeatureAvailability[] = Array.from(results.entries())
      .map(([featureKey, stats]) => {
        const field = featureFields.find(f => f.key === featureKey)!;
        return {
          feature_key: featureKey,
          feature_label: field.label,
          variant_count: stats.variants.size,
          car_count: stats.cars.size,
          brand_count: stats.brands.size,
          slug: `cars-with-${featureKey.replace(/_/g, '-')}`,
          suggested_title: `Cars with ${field.label}`,
          suggested_h1: `Best ${field.label} Cars in India`,
          suggested_meta_description: `Browse ${stats.cars.size}+ cars with ${field.label.toLowerCase()} feature. Compare specs, prices & reviews.`,
        };
      })
      .sort((a, b) => b.variant_count - a.variant_count);

    return output;
  }

  /**
   * Get nested value from object using dot notation path.
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
   * Auto-generate SEO presets for all features with at least N variants.
   * Only creates presets that don't already exist.
   */
  static async autoGeneratePresets(minVariantCount: number = 5) {
    const features = await this.generateFeatureAvailability();
    const created = [];

    // Batch fetch all existing presets to avoid N findOne queries in loop
    const existingPresets = await SeoPreset.find({ is_deleted: false }).select('slug').lean();
    const existingSlugs = new Set(existingPresets.map((p: any) => p.slug));

    for (const feature of features) {
      if (feature.variant_count < minVariantCount) continue;

      // Check if preset already exists using in-memory lookup
      if (existingSlugs.has(feature.slug)) continue;

      // Create preset
      const queryParams: DiscoveryFilters = {
        [`has_${feature.feature_key}`]: true,
        page: 1,
        limit: 20,
      };

      try {
        const preset = await SeoPresetService.create({
          slug: feature.slug,
          title: feature.suggested_title,
          h1: feature.suggested_h1,
          meta_description: feature.suggested_meta_description,
          meta_keywords: `${feature.feature_label}, cars, India, buy online`,
          query_params: queryParams,
          is_published: true,
          sort_order: 100 - feature.variant_count, // Popular features first
        });
        created.push(preset);
      } catch (err: any) {
        console.error(`Failed to create preset for ${feature.slug}:`, err.message);
      }
    }

    return {
      total_features: features.length,
      presets_created: created.length,
      created_presets: created,
      all_features: features,
    };
  }

  /**
   * Return all available features across all variants.
   * Used by the admin UI to populate feature availability checklist.
   */
  static async getAllFeatures() {
    return this.generateFeatureAvailability();
  }
}
