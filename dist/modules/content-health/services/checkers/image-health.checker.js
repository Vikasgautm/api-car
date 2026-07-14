"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runImageHealthChecker = runImageHealthChecker;
const car_image_model_1 = require("../../../../models/car-image.model");
const car_model_1 = require("../../../../models/car.model");
const CHECKER_NAME = 'image_health';
const SCAN_LIMIT = 500;
function issue(severity, category, entityId, entityName, entityType, code, title, description, recommendation, editUrl) {
    return {
        id: `${category}_${code}_${entityId}`,
        category,
        severity,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        issue_code: code,
        issue_title: title,
        issue_description: description,
        recommendation,
        edit_url: editUrl,
        detected_at: new Date().toISOString(),
    };
}
async function runImageHealthChecker(_params) {
    try {
        const issues = [];
        // Cars missing a primary published image
        const cars = await car_model_1.Car.find({ is_deleted: false })
            .select('car_id name slug thumbnail')
            .lean()
            .limit(SCAN_LIMIT);
        const carIds = cars.map((c) => c.car_id);
        // Cars that have a primary published CarImage
        const primaryImageCounts = await car_image_model_1.CarImage.aggregate([
            { $match: { car_id: { $in: carIds }, is_deleted: false, is_published: true, is_primary: true } },
            { $group: { _id: '$car_id' } },
        ]);
        const carsWithPrimary = new Set(primaryImageCounts.map((r) => r._id));
        for (const car of cars) {
            const hasThumbnail = car.thumbnail?.url && car.thumbnail.url.trim() !== '';
            const hasPrimaryImage = carsWithPrimary.has(car.car_id);
            if (!hasThumbnail && !hasPrimaryImage) {
                issues.push(issue('high', 'image_health', car.car_id, car.name, 'car', 'IMAGE_NO_FEATURED', 'Missing Featured Image', `Car "${car.name}" has no thumbnail or primary published image.`, 'Upload at least one primary image. Cars without images have significantly lower buyer engagement.', '/car-images'));
            }
        }
        // CarImages missing alt_text
        const imagesWithoutAlt = await car_image_model_1.CarImage.find({
            is_deleted: false,
            $or: [{ alt_text: { $exists: false } }, { alt_text: null }, { alt_text: '' }],
        })
            .select('car_image_id car_id url alt_text')
            .lean()
            .limit(200);
        for (const img of imagesWithoutAlt) {
            issues.push(issue('medium', 'image_health', img.car_image_id, img.url || img.car_image_id, 'car_image', 'IMAGE_NO_ALT', 'Missing Image Alt Text', `Image (ID: ${img.car_image_id}) on car_id "${img.car_id}" has no alt text, hurting image SEO.`, 'Add descriptive alt text including the car name, colour, and angle (e.g., "Hyundai Creta Red Front View").', '/car-images'));
        }
        // Non-WebP images (check by URL extension)
        const nonWebpImages = await car_image_model_1.CarImage.find({
            is_deleted: false,
            url: { $exists: true, $ne: '' },
            $expr: {
                $not: {
                    $regexMatch: { input: '$url', regex: /\.webp$/i },
                },
            },
        })
            .select('car_image_id car_id url')
            .lean()
            .limit(100);
        for (const img of nonWebpImages) {
            issues.push(issue('low', 'image_health', img.car_image_id, img.url || img.car_image_id, 'car_image', 'IMAGE_NOT_WEBP', 'Non-WebP Image Format', `Image "${img.url}" is not in WebP format, causing unnecessary page weight.`, 'Convert to WebP for 25–35% smaller file size with equal visual quality.', '/car-images'));
        }
        return { checker: CHECKER_NAME, issues, total: issues.length };
    }
    catch (err) {
        return { checker: CHECKER_NAME, issues: [], total: 0, error: err?.message || 'Image health checker failed' };
    }
}
