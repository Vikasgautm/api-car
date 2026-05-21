"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaFallbackService = void 0;
const car_image_model_1 = require("../../../models/car-image.model");
const car_model_1 = require("../../../models/car.model");
const media_priority_service_1 = require("./media-priority.service");
const PLACEHOLDER_URL = '/images/placeholder-car.webp';
const PLACEHOLDER_ALT = 'Car image placeholder';
class MediaFallbackService {
    /**
     * Global fallback chain for any image slot:
     * 1. top_variant_showcase image for the car
     * 2. standard car image (primary or priority-selected)
     * 3. brand thumbnail from the car document
     * 4. body-type placeholder (future: keyed on body_type)
     * 5. static default placeholder
     */
    static async resolveImage(carId) {
        // Level 1: top_variant_showcase
        const showcase = await car_image_model_1.CarImage.findOne({
            car_id: carId,
            media_scope: 'top_variant_showcase',
            status: 'published',
            is_deleted: false,
        }).select('url alt_text').lean();
        if (showcase) {
            return { url: showcase.url, alt_text: showcase.alt_text || '', level: 'variant_showcase' };
        }
        // Level 2: standard published images, priority-selected
        const standardImages = await car_image_model_1.CarImage.find({
            car_id: carId,
            status: 'published',
            is_deleted: false,
        }).select('url alt_text main_category sub_category is_primary media_scope sort_order').lean();
        if (standardImages.length) {
            const best = media_priority_service_1.MediaPriorityService.selectCardThumbnail(standardImages);
            if (best) {
                return { url: best.url, alt_text: best.alt_text || '', level: 'standard' };
            }
        }
        // Level 3: brand image from the car document
        const car = await car_model_1.Car.findOne({ car_id: carId }).select('brand name').populate('brand', 'logo_url name').lean();
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
exports.MediaFallbackService = MediaFallbackService;
//# sourceMappingURL=media-fallback.service.js.map