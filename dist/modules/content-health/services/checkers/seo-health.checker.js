"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSeoHealthChecker = runSeoHealthChecker;
const car_model_1 = require("../../../../models/car.model");
const CHECKER_NAME = 'seo_health';
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
async function runSeoHealthChecker(_params) {
    try {
        const issues = [];
        const cars = await car_model_1.Car.find({ is_deleted: false })
            .select('car_id name slug is_published meta_title meta_description canonical_url description noindex thumbnail og_image images')
            .lean()
            .limit(SCAN_LIMIT);
        for (const car of cars) {
            const editUrl = `/cars`;
            if (!car.meta_title || car.meta_title.trim() === '') {
                issues.push(issue('high', 'seo_health', car.car_id, car.name, 'car', 'SEO_NO_META_TITLE', 'Missing Meta Title', `Car "${car.name}" has no meta title set.`, 'Add a descriptive meta title (50–60 characters) including the car name and primary keyword.', editUrl));
            }
            if (!car.meta_description || car.meta_description.trim() === '') {
                issues.push(issue('high', 'seo_health', car.car_id, car.name, 'car', 'SEO_NO_META_DESC', 'Missing Meta Description', `Car "${car.name}" has no meta description.`, 'Add a compelling meta description (150–160 characters) summarising key features and buyer intent.', editUrl));
            }
            if (car.is_published && (!car.canonical_url || car.canonical_url.trim() === '')) {
                issues.push(issue('critical', 'seo_health', car.car_id, car.name, 'car', 'SEO_NO_CANONICAL', 'Missing Canonical URL on Published Page', `Published car "${car.name}" has no canonical URL, risking duplicate content penalties.`, 'Set a canonical URL pointing to the primary indexable URL for this page.', editUrl));
            }
            if (!car.description || car.description.trim().length < 100) {
                issues.push(issue('medium', 'seo_health', car.car_id, car.name, 'car', 'SEO_THIN_CONTENT', 'Thin Content', `Car "${car.name}" description is only ${(car.description || '').trim().length} characters — below the 100-character minimum.`, 'Expand the description to at least 200 words covering key specs, positioning, and USPs.', editUrl));
            }
            // Missing Open Graph image — degrades social/search link previews.
            if (car.is_published && (!car.og_image || car.og_image.trim() === '')) {
                issues.push(issue('high', 'seo_health', car.car_id, car.name, 'car', 'SEO_NO_OG_IMAGE', 'Missing Open Graph Image', `Published car "${car.name}" has no og:image, so shared links show no preview image.`, 'Set an og:image (1200×630 recommended) so social and search previews render a thumbnail.', '/car-images'));
            }
            // Thumbnail present but missing alt text — hurts image SEO and accessibility.
            if (car.thumbnail?.url && car.thumbnail.url.trim() !== '' && (!car.thumbnail.alt || car.thumbnail.alt.trim() === '')) {
                issues.push(issue('medium', 'seo_health', car.car_id, car.name, 'car', 'SEO_THUMBNAIL_NO_ALT', 'Thumbnail Missing Alt Text', `Car "${car.name}" has a thumbnail image with no alt text.`, 'Add descriptive alt text including the car name (e.g., "Hyundai Creta front three-quarter view").', '/car-images'));
            }
            // Gallery images missing alt text — each missing alt is a lost image-SEO signal.
            const galleryMissingAlt = (car.images ?? []).filter((img) => img?.url && img.url.trim() !== '' && (!img.alt || img.alt.trim() === '')).length;
            if (galleryMissingAlt > 0) {
                issues.push(issue('medium', 'seo_health', car.car_id, car.name, 'car', 'SEO_GALLERY_NO_ALT', 'Gallery Images Missing Alt Text', `Car "${car.name}" has ${galleryMissingAlt} gallery image(s) with no alt text.`, 'Add descriptive alt text to every gallery image (include the car name, colour, and angle) to improve image SEO.', '/car-images'));
            }
        }
        // Duplicate meta_title detection via aggregation
        try {
            const dupeGroups = await car_model_1.Car.aggregate([
                { $match: { is_deleted: false, meta_title: { $exists: true, $nin: [null, ''] } } },
                { $group: { _id: '$meta_title', count: { $sum: 1 }, docs: { $push: { car_id: '$car_id', name: '$name' } } } },
                { $match: { count: { $gt: 1 } } },
                { $limit: 50 },
            ]);
            for (const group of dupeGroups) {
                for (const doc of group.docs) {
                    issues.push(issue('high', 'seo_health', doc.car_id, doc.name, 'car', 'SEO_DUPE_META_TITLE', 'Duplicate Meta Title', `Meta title "${group._id}" is shared by ${group.count} cars, causing duplicate-content risk.`, 'Ensure each car has a unique meta title. Differentiate by year, generation, or positioning.', '/cars'));
                }
            }
        }
        catch (_e) { /* non-fatal */ }
        return { checker: CHECKER_NAME, issues, total: issues.length };
    }
    catch (err) {
        return { checker: CHECKER_NAME, issues: [], total: 0, error: err?.message || 'SEO health checker failed' };
    }
}
//# sourceMappingURL=seo-health.checker.js.map