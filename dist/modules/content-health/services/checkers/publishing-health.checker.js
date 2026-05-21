"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPublishingHealthChecker = runPublishingHealthChecker;
const car_model_1 = require("../../../../models/car.model");
const car_image_model_1 = require("../../../../models/car-image.model");
const redirect_model_1 = require("../../../../models/redirect.model");
const CHECKER_NAME = 'publishing_health';
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
async function runPublishingHealthChecker(_params) {
    try {
        const issues = [];
        const publishedCars = await car_model_1.Car.find({ is_deleted: false, is_published: true })
            .select('car_id name slug variant_count thumbnail meta_title noindex is_published')
            .lean()
            .limit(SCAN_LIMIT);
        const publishedCarIds = publishedCars.map((c) => c.car_id);
        // Which published cars have a primary image?
        const carsWithImage = await car_image_model_1.CarImage.aggregate([
            { $match: { car_id: { $in: publishedCarIds }, is_deleted: false, is_published: true, is_primary: true } },
            { $group: { _id: '$car_id' } },
        ]);
        const imageSet = new Set(carsWithImage.map((r) => r._id));
        for (const car of publishedCars) {
            // Published car with zero variants — users can't browse/buy
            if ((car.variant_count ?? 0) === 0) {
                issues.push(issue('critical', 'publishing_health', car.car_id, car.name, 'car', 'PUB_NO_VARIANTS', 'Published Car Has No Variants', `Published car "${car.name}" has no variants. Users see this page but cannot find price, specs, or choices.`, 'Add at least one variant with price and key specs before publishing, or unpublish until variants are ready.', '/cars'));
            }
            // Published car without primary image
            if (!imageSet.has(car.car_id) && !car.thumbnail?.url) {
                issues.push(issue('high', 'publishing_health', car.car_id, car.name, 'car', 'PUB_NO_IMAGE', 'Published Car Has No Image', `Published car "${car.name}" has no primary image. This severely reduces buyer trust and engagement.`, 'Upload and publish at least one primary image before the car is live to buyers.', '/car-images'));
            }
            // Published car without meta title
            if (!car.meta_title || car.meta_title.trim() === '') {
                issues.push(issue('high', 'publishing_health', car.car_id, car.name, 'car', 'PUB_NO_META_TITLE', 'Published Car Missing Meta Title', `Published car "${car.name}" is live but has no meta title. Search engines will use the page title as fallback.`, 'Set a meta title immediately for all published cars to control how they appear in search results.', '/cars'));
            }
            // Noindex on published page — conflicting signals
            if (car.noindex === true) {
                issues.push(issue('medium', 'publishing_health', car.car_id, car.name, 'car', 'PUB_NOINDEX_CONFLICT', 'Published Page Marked noindex', `Car "${car.name}" is published (visible to users) but marked noindex (hidden from search engines).`, 'Decide: if this page should rank, remove the noindex flag. If it should not rank, unpublish it instead.', '/cars'));
            }
        }
        // Unpublished cars that are linked to published redirects (orphan redirect targets)
        const unpublishedCars = await car_model_1.Car.find({ is_deleted: false, is_published: false })
            .select('car_id name slug')
            .lean()
            .limit(200);
        const unpublishedSlugs = new Set(unpublishedCars.map((c) => `/${c.slug}`));
        if (unpublishedSlugs.size > 0) {
            const targetingUnpublished = await redirect_model_1.Redirect.find({
                is_deleted: false,
                new_url: { $in: Array.from(unpublishedSlugs) },
            })
                .select('redirect_id old_url new_url')
                .lean()
                .limit(50);
            for (const r of targetingUnpublished) {
                issues.push(issue('high', 'publishing_health', r.redirect_id, r.old_url, 'redirect', 'PUB_REDIRECT_TO_DRAFT', 'Redirect Points to Unpublished Page', `Redirect "${r.old_url}" → "${r.new_url}" leads to an unpublished/draft car page.`, 'Update the redirect target to a published page, or publish the target car first.', '/redirects'));
            }
        }
        return { checker: CHECKER_NAME, issues, total: issues.length };
    }
    catch (err) {
        return { checker: CHECKER_NAME, issues: [], total: 0, error: err?.message || 'Publishing health checker failed' };
    }
}
//# sourceMappingURL=publishing-health.checker.js.map