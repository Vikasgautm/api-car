"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runUrlHealthChecker = runUrlHealthChecker;
const car_model_1 = require("../../../../models/car.model");
const car_variant_model_1 = require("../../../../models/car-variant.model");
const redirect_model_1 = require("../../../../models/redirect.model");
const CHECKER_NAME = 'url_health';
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
function detectRedirectLoop(startUrl, redirectMap) {
    const visited = new Set();
    let current = startUrl;
    while (redirectMap.has(current)) {
        if (visited.has(current))
            return true;
        visited.add(current);
        current = redirectMap.get(current);
    }
    return false;
}
async function runUrlHealthChecker(_params) {
    try {
        const issues = [];
        // Duplicate car slugs (should be enforced by unique index, but verify)
        const dupeSlugs = await car_model_1.Car.aggregate([
            { $match: { is_deleted: false } },
            { $group: { _id: '$slug', count: { $sum: 1 }, docs: { $push: { car_id: '$car_id', name: '$name' } } } },
            { $match: { count: { $gt: 1 } } },
            { $limit: 50 },
        ]);
        for (const group of dupeSlugs) {
            for (const doc of group.docs) {
                issues.push(issue('critical', 'url_health', doc.car_id, doc.name, 'car', 'URL_DUPE_CAR_SLUG', 'Duplicate Car Slug', `Slug "${group._id}" is shared by ${group.count} cars, breaking URL resolution.`, 'Assign a unique slug to each car. Regenerate slugs and create 301 redirects for any changed URLs.', '/cars'));
            }
        }
        // Duplicate variant slugs
        const dupeVariantSlugs = await car_variant_model_1.CarVariant.aggregate([
            { $match: { is_deleted: false } },
            { $group: { _id: '$slug', count: { $sum: 1 }, docs: { $push: { variant_id: '$variant_id', variant_name: '$variant_name' } } } },
            { $match: { count: { $gt: 1 } } },
            { $limit: 50 },
        ]);
        for (const group of dupeVariantSlugs) {
            for (const doc of group.docs) {
                issues.push(issue('critical', 'url_health', doc.variant_id, doc.variant_name, 'variant', 'URL_DUPE_VARIANT_SLUG', 'Duplicate Variant Slug', `Slug "${group._id}" is shared by ${group.count} variants.`, 'Assign unique slugs. Variant slugs should include the car slug as a prefix.', '/variants'));
            }
        }
        // Redirect loop detection
        const redirects = await redirect_model_1.Redirect.find({ is_deleted: false })
            .select('redirect_id old_url new_url')
            .lean()
            .limit(1000);
        const redirectMap = new Map();
        for (const r of redirects) {
            redirectMap.set(r.old_url, r.new_url);
        }
        for (const r of redirects) {
            if (detectRedirectLoop(r.old_url, redirectMap)) {
                issues.push(issue('critical', 'url_health', r.redirect_id, r.old_url, 'redirect', 'URL_REDIRECT_LOOP', 'Redirect Loop Detected', `Redirect from "${r.old_url}" forms a circular chain, causing infinite redirect errors.`, 'Break the redirect chain. Ensure all redirects resolve to a final non-redirecting destination.', '/redirects'));
            }
        }
        // Redirect pointing to a non-existent car slug
        const allCarSlugs = await car_model_1.Car.find({ is_deleted: false })
            .select('slug')
            .lean()
            .limit(2000);
        const slugSet = new Set(allCarSlugs.map((c) => `/${c.slug}`));
        for (const r of redirects) {
            // Check only redirects that look like car page paths (simple slug pattern)
            const target = r.new_url;
            if (/^\/[a-z0-9-]+$/.test(target) && !slugSet.has(target)) {
                issues.push(issue('high', 'url_health', r.redirect_id, r.old_url, 'redirect', 'URL_BROKEN_REDIRECT', 'Redirect to Non-Existent Page', `Redirect "${r.old_url}" → "${r.new_url}" targets a slug that does not exist.`, 'Update the redirect target to a valid existing page, or delete this redirect.', '/redirects'));
            }
        }
        // Invalid URL format on redirects (must start with /)
        for (const r of redirects) {
            if (!r.old_url.startsWith('/') || !r.new_url.startsWith('/')) {
                issues.push(issue('high', 'url_health', r.redirect_id, r.old_url, 'redirect', 'URL_INVALID_FORMAT', 'Invalid Redirect URL Format', `Redirect "${r.old_url}" → "${r.new_url}" uses a non-relative URL. Redirects must use relative paths starting with "/".`, 'Update redirect URLs to use relative paths (e.g., /old-page → /new-page).', '/redirects'));
            }
        }
        return { checker: CHECKER_NAME, issues, total: issues.length };
    }
    catch (err) {
        return { checker: CHECKER_NAME, issues: [], total: 0, error: err?.message || 'URL health checker failed' };
    }
}
