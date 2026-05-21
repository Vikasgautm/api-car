import { CarImage } from '../../../models/car-image.model';
import { Car } from '../../../models/car.model';
import { MediaPriorityService } from './media-priority.service';

export interface FallbackImageResult {
  url: string;
  alt_text: string;
  level: 'variant_showcase' | 'standard' | 'brand' | 'body_type' | 'placeholder';
}

const PLACEHOLDER_URL = '/images/placeholder-car.webp';
const PLACEHOLDER_ALT = 'Car image placeholder';

export class MediaFallbackService {
  /**
   * Global fallback chain for any image slot:
   * 1. top_variant_showcase image for the car
   * 2. standard car image (primary or priority-selected)
   * 3. brand thumbnail from the car document
   * 4. body-type placeholder (future: keyed on body_type)
   * 5. static default placeholder
   */
  static async resolveImage(carId: string): Promise<FallbackImageResult> {
    // Level 1: top_variant_showcase
    const showcase = await CarImage.findOne({
      car_id: carId,
      media_scope: 'top_variant_showcase',
      status: 'published',
      is_deleted: false,
    }).select('url alt_text').lean();

    if (showcase) {
      return { url: showcase.url, alt_text: showcase.alt_text || '', level: 'variant_showcase' };
    }

    // Level 2: standard published images, priority-selected
    const standardImages = await CarImage.find({
      car_id: carId,
      status: 'published',
      is_deleted: false,
    }).select('url alt_text main_category sub_category is_primary media_scope sort_order').lean();

    if (standardImages.length) {
      const best = MediaPriorityService.selectCardThumbnail(standardImages as any);
      if (best) {
        return { url: best.url, alt_text: (best as any).alt_text || '', level: 'standard' };
      }
    }

    // Level 3: brand image from the car document
    const car = await Car.findOne({ car_id: carId }).select('brand name').populate('brand', 'logo_url name').lean() as any;

    if (car?.brand?.logo_url) {
      return {
        url: car.brand.logo_url,
        alt_text: `${car.brand.name || 'Brand'} logo`,
        level: 'brand',
      };
    }

    // Level 4 / 5: body-type or static placeholder
    return { url: PLACEHOLDER_URL, alt_text: PLACEHOLDER_ALT, level: 'placeholder' };
  }
}
