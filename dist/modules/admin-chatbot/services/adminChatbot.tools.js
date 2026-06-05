"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = getDashboardSummary;
exports.searchCars = searchCars;
exports.getCarDataQualityReport = getCarDataQualityReport;
exports.searchVariants = searchVariants;
exports.getVariantDataQualityReport = getVariantDataQualityReport;
exports.getBrandsSummary = getBrandsSummary;
exports.getFuelTypesSummary = getFuelTypesSummary;
exports.getBodyTypesSummary = getBodyTypesSummary;
exports.getImportHistory = getImportHistory;
exports.getUnmatchedImportKeys = getUnmatchedImportKeys;
exports.getBlogsSummary = getBlogsSummary;
exports.getFAQsSummary = getFAQsSummary;
exports.getUsersSummary = getUsersSummary;
exports.getRecentErrors = getRecentErrors;
exports.getSystemHealth = getSystemHealth;
const car_model_1 = require("../../../models/car.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
const brand_model_1 = require("../../../models/brand.model");
const fuel_type_model_1 = require("../../../models/fuel-type.model");
const body_type_model_1 = require("../../../models/body-type.model");
const blog_model_1 = require("../../../models/blog.model");
const faq_model_1 = require("../../../models/faq.model");
const user_model_1 = require("../../../models/user.model");
const import_log_model_1 = require("../../../models/import-log.model");
const audit_log_model_1 = require("../../../models/audit-log.model");
const MAX_ROWS = Number(process.env.ADMIN_CHATBOT_MAX_RESULTS) || 20;
// Safe allowlist of fields returned for each entity type — never include sensitive fields
const SAFE_CAR_FIELDS = 'car_id name slug brand_id is_published is_deleted status createdAt';
const SAFE_VARIANT_FIELDS = 'variant_id name car_id fuel_type_id body_type_id price_ex_showroom is_published is_deleted';
const SAFE_USER_FIELDS = 'user_id user_name email role is_deleted createdAt';
const SAFE_BLOG_FIELDS = 'blog_id title slug is_published seo_title meta_description is_deleted createdAt';
const SAFE_FAQ_FIELDS = 'faq_id question answer is_published car_id is_deleted';
const SAFE_IMPORT_FIELDS = 'import_id source import_type status warnings error_messages createdAt car_id variant_id';
const SAFE_BRAND_FIELDS = 'brand_id name slug is_published is_deleted';
const SAFE_FUELTYPE_FIELDS = 'fuel_type_id name slug is_active';
const SAFE_BODYTYPE_FIELDS = 'body_type_id name slug is_active';
function paginate(arr, page, limit) {
    const start = (page - 1) * limit;
    return arr.slice(start, start + limit);
}
async function getDashboardSummary(page, limit) {
    const [totalCars, publishedCars, unpublishedCars, deletedCars, totalVariants, publishedVariants, unpublishedVariants, totalBrands, totalBlogs, publishedBlogs, totalFaqs, publishedFaqs, totalUsers,] = await Promise.all([
        car_model_1.Car.countDocuments({ is_deleted: false }),
        car_model_1.Car.countDocuments({ is_published: true, is_deleted: false }),
        car_model_1.Car.countDocuments({ is_published: false, is_deleted: false }),
        car_model_1.Car.countDocuments({ is_deleted: true }),
        car_variant_model_1.CarVariant.countDocuments({ is_deleted: false }),
        car_variant_model_1.CarVariant.countDocuments({ is_published: true, is_deleted: false }),
        car_variant_model_1.CarVariant.countDocuments({ is_published: false, is_deleted: false }),
        brand_model_1.Brand.countDocuments({ is_deleted: false }),
        blog_model_1.Blog.countDocuments({ is_deleted: false }),
        blog_model_1.Blog.countDocuments({ is_published: true, is_deleted: false }),
        faq_model_1.FAQ.countDocuments({ is_deleted: false }),
        faq_model_1.FAQ.countDocuments({ is_published: true, is_deleted: false }),
        user_model_1.User.countDocuments({ is_deleted: false }),
    ]);
    const summary = {
        total_cars: totalCars,
        published_cars: publishedCars,
        unpublished_cars: unpublishedCars,
        deleted_cars: deletedCars,
        total_variants: totalVariants,
        published_variants: publishedVariants,
        unpublished_variants: unpublishedVariants,
        total_brands: totalBrands,
        total_blogs: totalBlogs,
        published_blogs: publishedBlogs,
        total_faqs: totalFaqs,
        published_faqs: publishedFaqs,
        total_users: totalUsers,
    };
    return {
        data: [summary],
        summary: { total: totalCars },
        fallbackAnswer: `Admin panel has ${totalCars} cars (${publishedCars} published, ${unpublishedCars} unpublished), ${totalVariants} variants (${publishedVariants} published), ${totalBrands} brands, ${totalBlogs} blogs, ${totalFaqs} FAQs, and ${totalUsers} users.`,
    };
}
async function searchCars(filters, page, limit) {
    const query = {};
    if (filters.is_published !== undefined)
        query.is_published = filters.is_published;
    query.is_deleted = filters.is_deleted ?? false;
    const total = await car_model_1.Car.countDocuments(query);
    const cars = await car_model_1.Car.find(query)
        .select(SAFE_CAR_FIELDS)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    const rows = cars;
    return {
        data: rows,
        summary: { total, critical: filters.is_published === false ? total : 0 },
        fallbackAnswer: `Found ${total} cars matching your filter.`,
    };
}
async function getCarDataQualityReport(page, limit) {
    const [noBrandCars, noVariantCars, duplicateSlugs, missingSeoTitle, missingMetaDesc, publishedWithNoPublishedVariant,] = await Promise.all([
        car_model_1.Car.find({ brand_id: { $in: [null, ''] }, is_deleted: false })
            .select(SAFE_CAR_FIELDS).limit(MAX_ROWS).lean(),
        car_model_1.Car.aggregate([
            { $match: { is_deleted: false } },
            {
                $lookup: {
                    from: 'carvariants',
                    localField: 'car_id',
                    foreignField: 'car_id',
                    as: 'variants',
                    pipeline: [{ $match: { is_deleted: false } }],
                },
            },
            { $match: { 'variants.0': { $exists: false } } },
            { $project: { car_id: 1, name: 1, slug: 1, is_published: 1 } },
            { $limit: MAX_ROWS },
        ]),
        car_model_1.Car.aggregate([
            { $match: { is_deleted: false } },
            { $group: { _id: '$slug', count: { $sum: 1 }, car_ids: { $push: '$car_id' } } },
            { $match: { count: { $gt: 1 } } },
            { $limit: MAX_ROWS },
        ]),
        car_model_1.Car.find({ $or: [{ seo_title: { $in: [null, ''] } }, { seo_title: { $exists: false } }], is_deleted: false, is_published: true })
            .select(SAFE_CAR_FIELDS).limit(MAX_ROWS).lean(),
        car_model_1.Car.find({ $or: [{ meta_description: { $in: [null, ''] } }, { meta_description: { $exists: false } }], is_deleted: false, is_published: true })
            .select(SAFE_CAR_FIELDS).limit(MAX_ROWS).lean(),
        car_model_1.Car.aggregate([
            { $match: { is_published: true, is_deleted: false } },
            {
                $lookup: {
                    from: 'carvariants',
                    localField: 'car_id',
                    foreignField: 'car_id',
                    as: 'pub_variants',
                    pipeline: [{ $match: { is_published: true, is_deleted: false } }],
                },
            },
            { $match: { 'pub_variants.0': { $exists: false } } },
            { $project: { car_id: 1, name: 1, slug: 1 } },
            { $limit: MAX_ROWS },
        ]),
    ]);
    const issues = [
        ...noBrandCars.map(c => ({ ...c, issue: 'missing_brand' })),
        ...noVariantCars.map((c) => ({ ...c, issue: 'no_variants' })),
        ...duplicateSlugs.map((d) => ({ slug: d._id, count: d.count, car_ids: d.car_ids, issue: 'duplicate_slug' })),
        ...missingSeoTitle.map(c => ({ ...c, issue: 'missing_seo_title' })),
        ...missingMetaDesc.map(c => ({ ...c, issue: 'missing_meta_description' })),
        ...publishedWithNoPublishedVariant.map((c) => ({ ...c, issue: 'published_no_published_variant' })),
    ];
    const paged = paginate(issues, page, limit);
    const total = issues.length;
    const critical = noVariantCars.length + duplicateSlugs.length + noBrandCars.length;
    return {
        data: paged,
        summary: {
            total,
            critical,
            no_brand: noBrandCars.length,
            no_variants: noVariantCars.length,
            duplicate_slugs: duplicateSlugs.length,
            missing_seo_title: missingSeoTitle.length,
            missing_meta_description: missingMetaDesc.length,
            published_no_published_variant: publishedWithNoPublishedVariant.length,
        },
        fallbackAnswer: `Car data quality report: ${total} issues found. ${critical} critical (${noBrandCars.length} missing brand, ${noVariantCars.length} without variants, ${duplicateSlugs.length} duplicate slugs).`,
    };
}
async function searchVariants(filters, page, limit) {
    const query = {};
    query.is_deleted = filters.is_deleted ?? false;
    if (filters.is_published !== undefined)
        query.is_published = filters.is_published;
    if (filters.missingPrice) {
        query.$or = [{ price_ex_showroom: { $in: [null, 0, undefined] } }];
    }
    if (filters.missingFuelType) {
        query.fuel_type_id = { $in: [null, '', undefined] };
    }
    if (filters.missingBodyType) {
        query.body_type_id = { $in: [null, '', undefined] };
    }
    if (filters.car_name) {
        const car = await car_model_1.Car.findOne({ name: new RegExp(filters.car_name, 'i'), is_deleted: false })
            .select('car_id').lean();
        if (car)
            query.car_id = car.car_id;
    }
    const total = await car_variant_model_1.CarVariant.countDocuments(query);
    const variants = await car_variant_model_1.CarVariant.find(query)
        .select(SAFE_VARIANT_FIELDS)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    return {
        data: variants,
        summary: { total },
        fallbackAnswer: `Found ${total} variants matching your filter.`,
    };
}
async function getVariantDataQualityReport(page, limit) {
    const [missingPrice, missingFuelType, missingBodyType, orphanedVariants, unpublishedUnderPublished,] = await Promise.all([
        car_variant_model_1.CarVariant.find({
            $or: [{ price_ex_showroom: { $in: [null, 0, undefined] } }],
            is_deleted: false,
        }).select(SAFE_VARIANT_FIELDS).limit(MAX_ROWS).lean(),
        car_variant_model_1.CarVariant.find({
            $or: [{ fuel_type_id: { $in: [null, '', undefined] } }],
            is_deleted: false,
        }).select(SAFE_VARIANT_FIELDS).limit(MAX_ROWS).lean(),
        car_variant_model_1.CarVariant.find({
            $or: [{ body_type_id: { $in: [null, '', undefined] } }],
            is_deleted: false,
        }).select(SAFE_VARIANT_FIELDS).limit(MAX_ROWS).lean(),
        car_variant_model_1.CarVariant.aggregate([
            { $match: { is_deleted: false } },
            {
                $lookup: {
                    from: 'cars',
                    localField: 'car_id',
                    foreignField: 'car_id',
                    as: 'car',
                    pipeline: [{ $match: { is_deleted: false } }],
                },
            },
            { $match: { 'car.0': { $exists: false } } },
            { $project: { variant_id: 1, name: 1, car_id: 1 } },
            { $limit: MAX_ROWS },
        ]),
        car_variant_model_1.CarVariant.aggregate([
            { $match: { is_published: false, is_deleted: false } },
            {
                $lookup: {
                    from: 'cars',
                    localField: 'car_id',
                    foreignField: 'car_id',
                    as: 'car',
                    pipeline: [{ $match: { is_published: true, is_deleted: false } }],
                },
            },
            { $match: { 'car.0': { $exists: true } } },
            { $project: { variant_id: 1, name: 1, car_id: 1 } },
            { $limit: MAX_ROWS },
        ]),
    ]);
    const issues = [
        ...missingPrice.map(v => ({ ...v, issue: 'missing_price' })),
        ...missingFuelType.map(v => ({ ...v, issue: 'missing_fuel_type' })),
        ...missingBodyType.map(v => ({ ...v, issue: 'missing_body_type' })),
        ...orphanedVariants.map((v) => ({ ...v, issue: 'orphaned_variant' })),
        ...unpublishedUnderPublished.map((v) => ({ ...v, issue: 'unpublished_under_published_car' })),
    ];
    const paged = paginate(issues, page, limit);
    const total = issues.length;
    const critical = orphanedVariants.length + missingPrice.length;
    return {
        data: paged,
        summary: {
            total,
            critical,
            missing_price: missingPrice.length,
            missing_fuel_type: missingFuelType.length,
            missing_body_type: missingBodyType.length,
            orphaned: orphanedVariants.length,
            unpublished_under_published_car: unpublishedUnderPublished.length,
        },
        fallbackAnswer: `Variant quality report: ${total} issues. ${critical} critical (${missingPrice.length} missing price, ${orphanedVariants.length} orphaned).`,
    };
}
async function getBrandsSummary(page, limit) {
    const [brands, noCarsResults] = await Promise.all([
        brand_model_1.Brand.find({ is_deleted: false }).select(SAFE_BRAND_FIELDS).sort({ name: 1 }).lean(),
        brand_model_1.Brand.aggregate([
            { $match: { is_deleted: false } },
            {
                $lookup: {
                    from: 'cars',
                    localField: 'brand_id',
                    foreignField: 'brand_id',
                    as: 'cars',
                    pipeline: [{ $match: { is_deleted: false } }],
                },
            },
            { $match: { 'cars.0': { $exists: false } } },
            { $project: { brand_id: 1, name: 1, slug: 1 } },
        ]),
    ]);
    const paged = paginate(brands, page, limit);
    return {
        data: paged,
        summary: { total: brands.length, no_cars: noCarsResults.length },
        fallbackAnswer: `${brands.length} brands total. ${noCarsResults.length} brands have no cars.`,
    };
}
async function getFuelTypesSummary(page, limit) {
    const fuelTypes = await fuel_type_model_1.FuelType.find({}).select(SAFE_FUELTYPE_FIELDS).lean();
    const usageCounts = await car_variant_model_1.CarVariant.aggregate([
        { $match: { is_deleted: false } },
        { $group: { _id: '$fuel_type_id', count: { $sum: 1 } } },
    ]);
    const usageMap = Object.fromEntries(usageCounts.map((u) => [u._id, u.count]));
    const enriched = fuelTypes.map(ft => ({
        ...ft,
        variant_count: usageMap[ft.fuel_type_id] ?? 0,
    }));
    const paged = paginate(enriched, page, limit);
    return {
        data: paged,
        summary: { total: fuelTypes.length },
        fallbackAnswer: `${fuelTypes.length} fuel types in database.`,
    };
}
async function getBodyTypesSummary(page, limit) {
    const bodyTypes = await body_type_model_1.BodyType.find({}).select(SAFE_BODYTYPE_FIELDS).lean();
    const usageCounts = await car_variant_model_1.CarVariant.aggregate([
        { $match: { is_deleted: false } },
        { $group: { _id: '$body_type_id', count: { $sum: 1 } } },
    ]);
    const usageMap = Object.fromEntries(usageCounts.map((u) => [u._id, u.count]));
    const enriched = bodyTypes.map(bt => ({
        ...bt,
        variant_count: usageMap[bt.body_type_id] ?? 0,
    }));
    const paged = paginate(enriched, page, limit);
    return {
        data: paged,
        summary: { total: bodyTypes.length },
        fallbackAnswer: `${bodyTypes.length} body types in database.`,
    };
}
async function getImportHistory(page, limit) {
    const total = await import_log_model_1.ImportLog.countDocuments({});
    const logs = await import_log_model_1.ImportLog.find({})
        .select(SAFE_IMPORT_FIELDS)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    const failedCount = await import_log_model_1.ImportLog.countDocuments({ status: 'failed' });
    return {
        data: logs,
        summary: { total, failed: failedCount },
        fallbackAnswer: `${total} import logs total. ${failedCount} failed.`,
    };
}
async function getUnmatchedImportKeys(page, limit) {
    const logs = await import_log_model_1.ImportLog.find({ 'unmatched_data': { $ne: {} } })
        .select('import_id source import_type unmatched_data warnings createdAt car_id variant_id')
        .sort({ createdAt: -1 })
        .limit(MAX_ROWS)
        .lean();
    const rows = logs.map(log => {
        const l = log;
        return {
            import_id: l.import_id,
            source: l.source,
            import_type: l.import_type,
            unmatched_keys: Object.keys(l.unmatched_data ?? {}),
            unmatched_count: Object.keys(l.unmatched_data ?? {}).length,
            car_id: l.car_id,
            variant_id: l.variant_id,
            createdAt: l.createdAt,
        };
    });
    const paged = paginate(rows, page, limit);
    return {
        data: paged,
        summary: { total: rows.length },
        fallbackAnswer: `${rows.length} imports have unmatched keys.`,
    };
}
async function getBlogsSummary(page, limit) {
    const [total, unpublished, missingSeoTitle, missingMeta] = await Promise.all([
        blog_model_1.Blog.countDocuments({ is_deleted: false }),
        blog_model_1.Blog.countDocuments({ is_published: false, is_deleted: false }),
        blog_model_1.Blog.countDocuments({ $or: [{ seo_title: { $in: [null, ''] } }, { seo_title: { $exists: false } }], is_deleted: false }),
        blog_model_1.Blog.countDocuments({ $or: [{ meta_description: { $in: [null, ''] } }, { meta_description: { $exists: false } }], is_deleted: false }),
    ]);
    const blogs = await blog_model_1.Blog.find({ is_deleted: false })
        .select(SAFE_BLOG_FIELDS)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    return {
        data: blogs,
        summary: { total, unpublished, missing_seo_title: missingSeoTitle, missing_meta_description: missingMeta, critical: missingSeoTitle + missingMeta },
        fallbackAnswer: `${total} blogs. ${unpublished} unpublished. ${missingSeoTitle} missing SEO title, ${missingMeta} missing meta description.`,
    };
}
async function getFAQsSummary(page, limit) {
    const [total, noAnswer, unpublished] = await Promise.all([
        faq_model_1.FAQ.countDocuments({ is_deleted: false }),
        faq_model_1.FAQ.countDocuments({ $or: [{ answer: { $in: [null, ''] } }, { answer: { $exists: false } }], is_deleted: false }),
        faq_model_1.FAQ.countDocuments({ is_published: false, is_deleted: false }),
    ]);
    const faqs = await faq_model_1.FAQ.find({ is_deleted: false })
        .select(SAFE_FAQ_FIELDS)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    return {
        data: faqs,
        summary: { total, no_answer: noAnswer, unpublished },
        fallbackAnswer: `${total} FAQs. ${noAnswer} missing answers. ${unpublished} unpublished.`,
    };
}
async function getUsersSummary(page, limit) {
    const [total, admins, editors, viewers] = await Promise.all([
        user_model_1.User.countDocuments({ is_deleted: false }),
        user_model_1.User.countDocuments({ role: 'admin', is_deleted: false }),
        user_model_1.User.countDocuments({ role: 'editor', is_deleted: false }),
        user_model_1.User.countDocuments({ role: 'viewer', is_deleted: false }),
    ]);
    const users = await user_model_1.User.find({ is_deleted: false })
        .select(SAFE_USER_FIELDS)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    return {
        data: users,
        summary: { total, admins, editors, viewers },
        fallbackAnswer: `${total} users: ${admins} admin, ${editors} editor, ${viewers} viewer.`,
    };
}
async function getRecentErrors(page, limit) {
    const failedImports = await import_log_model_1.ImportLog.find({ status: 'failed' })
        .select(SAFE_IMPORT_FIELDS)
        .sort({ createdAt: -1 })
        .limit(MAX_ROWS)
        .lean();
    const recentAuditErrors = await audit_log_model_1.AuditLog.find({ action: { $in: ['error', 'import_failed'] } })
        .select('entity_type entity_id action details createdAt')
        .sort({ createdAt: -1 })
        .limit(MAX_ROWS)
        .lean();
    const combined = [
        ...failedImports.map(i => ({ ...i, type: 'failed_import' })),
        ...recentAuditErrors.map(a => ({ ...a, type: 'audit_error' })),
    ].sort((a, b) => {
        const dateA = a.createdAt;
        const dateB = b.createdAt;
        return (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0);
    });
    const paged = paginate(combined, page, limit);
    return {
        data: paged,
        summary: { total: combined.length, failed_imports: failedImports.length },
        fallbackAnswer: `${combined.length} recent errors found (${failedImports.length} failed imports).`,
    };
}
async function getSystemHealth(page, limit) {
    const [totalCars, carsWithIssues, totalVariants, variantsWithIssues, failedImports, unmatchedImports,] = await Promise.all([
        car_model_1.Car.countDocuments({ is_deleted: false }),
        car_model_1.Car.countDocuments({
            is_deleted: false,
            $or: [
                { brand_id: { $in: [null, ''] } },
                { seo_title: { $in: [null, ''] } },
            ],
        }),
        car_variant_model_1.CarVariant.countDocuments({ is_deleted: false }),
        car_variant_model_1.CarVariant.countDocuments({
            is_deleted: false,
            $or: [
                { price_ex_showroom: { $in: [null, 0] } },
                { fuel_type_id: { $in: [null, ''] } },
            ],
        }),
        import_log_model_1.ImportLog.countDocuments({ status: 'failed' }),
        import_log_model_1.ImportLog.countDocuments({ 'unmatched_data': { $ne: {} } }),
    ]);
    const healthScore = Math.round((1 - (carsWithIssues + variantsWithIssues) / Math.max(totalCars + totalVariants, 1)) * 100);
    const summary = {
        health_score_pct: healthScore,
        total_cars: totalCars,
        cars_with_issues: carsWithIssues,
        total_variants: totalVariants,
        variants_with_issues: variantsWithIssues,
        failed_imports: failedImports,
        unmatched_imports: unmatchedImports,
        critical: carsWithIssues + variantsWithIssues + failedImports,
    };
    return {
        data: [summary],
        summary,
        fallbackAnswer: `System health score: ${healthScore}%. ${carsWithIssues} cars and ${variantsWithIssues} variants have issues. ${failedImports} failed imports.`,
    };
}
//# sourceMappingURL=adminChatbot.tools.js.map