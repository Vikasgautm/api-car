import { Car } from '../../../models/car.model';
import { CarVariant } from '../../../models/car-variant.model';
import { Brand } from '../../../models/brand.model';
import { FuelType } from '../../../models/fuel-type.model';
import { BodyType } from '../../../models/body-type.model';
import { Blog } from '../../../models/blog.model';
import { FAQ } from '../../../models/faq.model';
import { User } from '../../../models/user.model';
import { ImportLog } from '../../../models/import-log.model';
import { AuditLog } from '../../../models/audit-log.model';
import { City } from '../../../models/city.model';
import { RankingScore } from '../../../models/ranking-score.model';
import { SeoCollection } from '../../../models/seo-collection.model';
import { PopularCollection } from '../../../models/popular-collection.model';
import type { ToolResult, ActionProposal, ChatbotWriteAction } from '../types/adminChatbot.types';

const MAX_ROWS = Number(process.env.ADMIN_CHATBOT_MAX_RESULTS) || 20;

// Safe allowlist of fields returned for each entity type — never include sensitive fields
const SAFE_CAR_FIELDS = 'car_id name slug brand_id is_published is_deleted status createdAt';
const SAFE_VARIANT_FIELDS = 'variant_id name car_id fuel_type_id body_type_id ex_showroom_price is_published is_deleted';
const SAFE_USER_FIELDS = 'user_id user_name email role is_deleted createdAt';
const SAFE_BLOG_FIELDS = 'blog_id title slug is_published seo_title meta_description is_deleted createdAt';
const SAFE_FAQ_FIELDS = 'faq_id question answer is_published car_id is_deleted';
const SAFE_IMPORT_FIELDS = 'import_id source import_type status warnings error_messages createdAt car_id variant_id';
const SAFE_BRAND_FIELDS = 'brand_id name slug is_published is_deleted';
const SAFE_FUELTYPE_FIELDS = 'fuel_type_id name slug is_active';
const SAFE_BODYTYPE_FIELDS = 'body_type_id name slug is_active';

function paginate<T>(arr: T[], page: number, limit: number): T[] {
  const start = (page - 1) * limit;
  return arr.slice(start, start + limit);
}

async function enrichCarRows(rows: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
  const brandIds = [...new Set(rows.map(r => r.brand_id as string).filter(Boolean))];
  const brandMap: Record<string, string> = {};
  if (brandIds.length) {
    const brands = await Brand.find({ brand_id: { $in: brandIds } }).select('brand_id name').lean();
    (brands as { brand_id: string; name: string }[]).forEach(b => { brandMap[b.brand_id] = b.name; });
  }
  return rows.map(r => {
    if (!r.brand_id) return r;
    const { brand_id, ...rest } = r;
    return { ...rest, brand: brandMap[brand_id as string] ?? '—' };
  });
}

async function enrichVariantRows(rows: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
  const carIds = [...new Set(rows.map(r => r.car_id as string).filter(Boolean))];
  const fuelTypeIds = [...new Set(rows.map(r => r.fuel_type_id as string).filter(Boolean))];
  const bodyTypeIds = [...new Set(rows.map(r => r.body_type_id as string).filter(Boolean))];

  const [carDocs, fuelDocs, bodyDocs] = await Promise.all([
    carIds.length ? Car.find({ car_id: { $in: carIds } }).select('car_id name').lean() : [],
    fuelTypeIds.length ? FuelType.find({ fuel_type_id: { $in: fuelTypeIds } }).select('fuel_type_id name').lean() : [],
    bodyTypeIds.length ? BodyType.find({ body_type_id: { $in: bodyTypeIds } }).select('body_type_id name').lean() : [],
  ]);

  const carMap: Record<string, string> = {};
  const fuelMap: Record<string, string> = {};
  const bodyMap: Record<string, string> = {};
  (carDocs as { car_id: string; name: string }[]).forEach(c => { carMap[c.car_id] = c.name; });
  (fuelDocs as { fuel_type_id: string; name: string }[]).forEach(f => { fuelMap[f.fuel_type_id] = f.name; });
  (bodyDocs as { body_type_id: string; name: string }[]).forEach(b => { bodyMap[b.body_type_id] = b.name; });

  return rows.map(r => {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(r)) {
      if (key === 'car_id') {
        result.car = val ? (carMap[val as string] ?? 'NOT FOUND') : undefined;
      } else if (key === 'fuel_type_id') {
        result.fuel_type = val ? (fuelMap[val as string] ?? '—') : undefined;
      } else if (key === 'body_type_id') {
        result.body_type = val ? (bodyMap[val as string] ?? '—') : undefined;
      } else {
        result[key] = val;
      }
    }
    return result;
  });
}

async function enrichFaqRows(rows: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
  const carIds = [...new Set(rows.map(r => r.car_id as string).filter(Boolean))];
  const carMap: Record<string, string> = {};
  if (carIds.length) {
    const cars = await Car.find({ car_id: { $in: carIds } }).select('car_id name').lean();
    (cars as { car_id: string; name: string }[]).forEach(c => { carMap[c.car_id] = c.name; });
  }
  return rows.map(r => {
    if (!r.car_id) return r;
    const { car_id, ...rest } = r;
    return { ...rest, car: carMap[car_id as string] ?? '—' };
  });
}

export async function getDashboardSummary(page: number, limit: number): Promise<ToolResult> {
  const [
    totalCars, publishedCars, unpublishedCars, deletedCars,
    totalVariants, publishedVariants, unpublishedVariants,
    totalBrands, totalBlogs, publishedBlogs,
    totalFaqs, publishedFaqs,
    totalUsers,
  ] = await Promise.all([
    Car.countDocuments({ is_deleted: false }),
    Car.countDocuments({ is_published: true, is_deleted: false }),
    Car.countDocuments({ is_published: false, is_deleted: false }),
    Car.countDocuments({ is_deleted: true }),
    CarVariant.countDocuments({ is_deleted: false }),
    CarVariant.countDocuments({ is_published: true, is_deleted: false }),
    CarVariant.countDocuments({ is_published: false, is_deleted: false }),
    Brand.countDocuments({ is_deleted: false }),
    Blog.countDocuments({ is_deleted: false }),
    Blog.countDocuments({ is_published: true, is_deleted: false }),
    FAQ.countDocuments({ is_deleted: false }),
    FAQ.countDocuments({ is_published: true, is_deleted: false }),
    User.countDocuments({ is_deleted: false }),
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
    data: [summary as unknown as Record<string, unknown>],
    summary: { total: totalCars },
    fallbackAnswer: `Admin panel has ${totalCars} cars (${publishedCars} published, ${unpublishedCars} unpublished), ${totalVariants} variants (${publishedVariants} published), ${totalBrands} brands, ${totalBlogs} blogs, ${totalFaqs} FAQs, and ${totalUsers} users.`,
  };
}

export async function searchCars(
  filters: { is_published?: boolean; is_deleted?: boolean; hasMissingBrand?: boolean },
  page: number,
  limit: number,
): Promise<ToolResult> {
  const query: Record<string, unknown> = {};
  if (filters.is_published !== undefined) query.is_published = filters.is_published;
  query.is_deleted = filters.is_deleted ?? false;

  const total = await Car.countDocuments(query);
  const cars = await Car.find(query)
    .select(SAFE_CAR_FIELDS)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const enriched = await enrichCarRows(cars as unknown as Record<string, unknown>[]);

  return {
    data: enriched,
    summary: { total, critical: filters.is_published === false ? total : 0 },
    fallbackAnswer: `Found ${total} cars matching your filter.`,
  };
}

export async function getCarDataQualityReport(page: number, limit: number): Promise<ToolResult> {
  const [
    noBrandCars,
    usedCarIds,
    duplicateSlugs,
    missingSeoTitle,
    missingMetaDesc,
    pubVariantCarIds,
  ] = await Promise.all([
    Car.find({ brand_id: { $in: [null, ''] }, is_deleted: false })
      .select(SAFE_CAR_FIELDS).limit(MAX_ROWS).lean(),
    CarVariant.distinct('car_id', { is_deleted: false }),
    Car.aggregate([
      { $match: { is_deleted: false } },
      { $group: { _id: '$slug', count: { $sum: 1 } } },
    ]),
    Car.find({ $or: [{ seo_title: { $in: [null, ''] } }, { seo_title: { $exists: false } }], is_deleted: false, is_published: true })
      .select(SAFE_CAR_FIELDS).limit(MAX_ROWS).lean(),
    Car.find({ $or: [{ meta_description: { $in: [null, ''] } }, { meta_description: { $exists: false } }], is_deleted: false, is_published: true })
      .select(SAFE_CAR_FIELDS).limit(MAX_ROWS).lean(),
    CarVariant.distinct('car_id', { is_published: true, is_deleted: false }),
  ]);

  const usedCarSet = new Set(usedCarIds.filter(Boolean));
  const pubVariantCarSet = new Set(pubVariantCarIds.filter(Boolean));

  const [noVariantCars, publishedWithNoPublishedVariant] = await Promise.all([
    Car.find({ is_deleted: false, car_id: { $nin: Array.from(usedCarSet) } })
      .select(SAFE_CAR_FIELDS).limit(MAX_ROWS).lean(),
    Car.find({ is_published: true, is_deleted: false, car_id: { $nin: Array.from(pubVariantCarSet) } })
      .select(SAFE_CAR_FIELDS).limit(MAX_ROWS).lean(),
  ]);

  const actualDuplicateSlugs = (duplicateSlugs as unknown as { _id: string; count: number }[])
    .filter(d => d.count > 1)
    .slice(0, MAX_ROWS);

  const rawIssues = [
    ...noBrandCars.map(c => ({ ...(c as unknown as Record<string,unknown>), issue: 'missing_brand' })),
    ...noVariantCars.map(c => ({ ...(c as unknown as Record<string,unknown>), issue: 'no_variants' })),
    ...actualDuplicateSlugs.map(d => ({ slug: d._id, count: d.count, issue: 'duplicate_slug' })),
    ...missingSeoTitle.map(c => ({ ...(c as unknown as Record<string,unknown>), issue: 'missing_seo_title' })),
    ...missingMetaDesc.map(c => ({ ...(c as unknown as Record<string,unknown>), issue: 'missing_meta_description' })),
    ...publishedWithNoPublishedVariant.map(c => ({ ...(c as unknown as Record<string,unknown>), issue: 'published_no_published_variant' })),
  ];

  const issues = await enrichCarRows(rawIssues);
  const paged = paginate(issues, page, limit);
  const total = issues.length;
  const critical = noVariantCars.length + actualDuplicateSlugs.length + noBrandCars.length;

  return {
    data: paged,
    summary: {
      total,
      critical,
      no_brand: noBrandCars.length,
      no_variants: noVariantCars.length,
      duplicate_slugs: actualDuplicateSlugs.length,
      missing_seo_title: missingSeoTitle.length,
      missing_meta_description: missingMetaDesc.length,
      published_no_published_variant: publishedWithNoPublishedVariant.length,
    },
    fallbackAnswer: `Car data quality report: ${total} issues found. ${critical} critical (${noBrandCars.length} missing brand, ${noVariantCars.length} without variants, ${actualDuplicateSlugs.length} duplicate slugs).`,
  };
}

export async function searchVariants(
  filters: {
    car_name?: string;
    is_published?: boolean;
    is_deleted?: boolean;
    missingPrice?: boolean;
    missingFuelType?: boolean;
    missingBodyType?: boolean;
  },
  page: number,
  limit: number,
): Promise<ToolResult> {
  const query: Record<string, unknown> = {};
  query.is_deleted = filters.is_deleted ?? false;
  if (filters.is_published !== undefined) query.is_published = filters.is_published;
  if (filters.missingPrice) {
    query.$or = [{ ex_showroom_price: { $in: [null, 0, undefined] } }];
  }
  if (filters.missingFuelType) {
    query.fuel_type_id = { $in: [null, '', undefined] };
  }
  if (filters.missingBodyType) {
    query.body_type_id = { $in: [null, '', undefined] };
  }

  if (filters.car_name) {
    const car = await Car.findOne({ name: new RegExp(filters.car_name, 'i'), is_deleted: false })
      .select('car_id').lean();
    if (car) query.car_id = (car as { car_id: string }).car_id;
  }

  const total = await CarVariant.countDocuments(query);
  const variants = await CarVariant.find(query)
    .select(SAFE_VARIANT_FIELDS)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const enriched = await enrichVariantRows(variants as unknown as Record<string, unknown>[]);

  return {
    data: enriched,
    summary: { total },
    fallbackAnswer: `Found ${total} variants matching your filter.`,
  };
}

export async function getVariantDataQualityReport(page: number, limit: number): Promise<ToolResult> {
  const [
    missingPrice,
    missingFuelType,
    missingBodyType,
    allCarIds,
    pubCarIds,
  ] = await Promise.all([
    CarVariant.find({
      $or: [{ ex_showroom_price: { $in: [null, 0, undefined] } }],
      is_deleted: false,
    }).select(SAFE_VARIANT_FIELDS).limit(MAX_ROWS).lean(),
    CarVariant.find({
      $or: [{ fuel_type_id: { $in: [null, '', undefined] } }],
      is_deleted: false,
    }).select(SAFE_VARIANT_FIELDS).limit(MAX_ROWS).lean(),
    CarVariant.find({
      $or: [{ body_type_id: { $in: [null, '', undefined] } }],
      is_deleted: false,
    }).select(SAFE_VARIANT_FIELDS).limit(MAX_ROWS).lean(),
    Car.distinct('car_id', { is_deleted: false }),
    Car.distinct('car_id', { is_published: true, is_deleted: false }),
  ]);

  const validCarSet = new Set(allCarIds.filter(Boolean));
  const pubCarSet = new Set(pubCarIds.filter(Boolean));

  const [orphanedVariants, unpublishedUnderPublished] = await Promise.all([
    CarVariant.find({ is_deleted: false, car_id: { $nin: Array.from(validCarSet) } })
      .select(SAFE_VARIANT_FIELDS).limit(MAX_ROWS).lean(),
    CarVariant.find({ is_published: false, is_deleted: false, car_id: { $in: Array.from(pubCarSet) } })
      .select(SAFE_VARIANT_FIELDS).limit(MAX_ROWS).lean(),
  ]);

  const rawIssues = [
    ...missingPrice.map(v => ({ ...(v as unknown as Record<string,unknown>), issue: 'missing_price' })),
    ...missingFuelType.map(v => ({ ...(v as unknown as Record<string,unknown>), issue: 'missing_fuel_type' })),
    ...missingBodyType.map(v => ({ ...(v as unknown as Record<string,unknown>), issue: 'missing_body_type' })),
    ...orphanedVariants.map(v => ({ ...(v as unknown as Record<string,unknown>), issue: 'orphaned_variant' })),
    ...unpublishedUnderPublished.map(v => ({ ...(v as unknown as Record<string,unknown>), issue: 'unpublished_under_published_car' })),
  ];
  const issues = await enrichVariantRows(rawIssues);

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

export async function getBrandsSummary(page: number, limit: number): Promise<ToolResult> {
  const [brands, activeBrandIds] = await Promise.all([
    Brand.find({ is_deleted: false }).select(SAFE_BRAND_FIELDS).sort({ name: 1 }).lean(),
    Car.distinct('brand_id', { is_deleted: false }),
  ]);

  const activeSet = new Set(activeBrandIds.filter(Boolean));
  const noCarsResults = brands.filter(b => !activeSet.has((b as any).brand_id));

  const paged = paginate(brands as unknown as Record<string, unknown>[], page, limit);
  return {
    data: paged,
    summary: { total: brands.length, no_cars: noCarsResults.length },
    fallbackAnswer: `${brands.length} brands total. ${noCarsResults.length} brands have no cars.`,
  };
}

export async function getFuelTypesSummary(page: number, limit: number): Promise<ToolResult> {
  const fuelTypes = await FuelType.find({}).select(SAFE_FUELTYPE_FIELDS).lean();
  const usageCounts = await CarVariant.aggregate([
    { $match: { is_deleted: false } },
    { $group: { _id: '$fuel_type_id', count: { $sum: 1 } } },
  ]);
  const usageMap = Object.fromEntries(usageCounts.map((u: { _id: string; count: number }) => [u._id, u.count]));
  const enriched = fuelTypes.map(ft => ({
    ...(ft as unknown as Record<string, unknown>),
    variant_count: usageMap[(ft as { fuel_type_id: string }).fuel_type_id] ?? 0,
  }));
  const paged = paginate(enriched, page, limit);
  return {
    data: paged,
    summary: { total: fuelTypes.length },
    fallbackAnswer: `${fuelTypes.length} fuel types in database.`,
  };
}

export async function getBodyTypesSummary(page: number, limit: number): Promise<ToolResult> {
  const bodyTypes = await BodyType.find({}).select(SAFE_BODYTYPE_FIELDS).lean();
  const usageCounts = await CarVariant.aggregate([
    { $match: { is_deleted: false } },
    { $group: { _id: '$body_type_id', count: { $sum: 1 } } },
  ]);
  const usageMap = Object.fromEntries(usageCounts.map((u: { _id: string; count: number }) => [u._id, u.count]));
  const enriched = bodyTypes.map(bt => ({
    ...(bt as unknown as Record<string, unknown>),
    variant_count: usageMap[(bt as { body_type_id: string }).body_type_id] ?? 0,
  }));
  const paged = paginate(enriched, page, limit);
  return {
    data: paged,
    summary: { total: bodyTypes.length },
    fallbackAnswer: `${bodyTypes.length} body types in database.`,
  };
}

export async function getImportHistory(page: number, limit: number): Promise<ToolResult> {
  const total = await ImportLog.countDocuments({});
  const logs = await ImportLog.find({})
    .select(SAFE_IMPORT_FIELDS)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const failedCount = await ImportLog.countDocuments({ status: 'failed' });

  return {
    data: logs as unknown as Record<string, unknown>[],
    summary: { total, failed: failedCount },
    fallbackAnswer: `${total} import logs total. ${failedCount} failed.`,
  };
}

export async function getUnmatchedImportKeys(page: number, limit: number): Promise<ToolResult> {
  const logs = await ImportLog.find({ 'unmatched_data': { $ne: {} } })
    .select('import_id source import_type unmatched_data warnings createdAt car_id variant_id')
    .sort({ createdAt: -1 })
    .limit(MAX_ROWS)
    .lean();

  const rows = logs.map(log => {
    const l = log as {
      import_id: string;
      source: string;
      import_type: string;
      unmatched_data?: Record<string, unknown>;
      createdAt: Date;
      car_id?: string;
      variant_id?: string;
    };
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

export async function getBlogsSummary(page: number, limit: number): Promise<ToolResult> {
  const [total, unpublished, missingSeoTitle, missingMeta] = await Promise.all([
    Blog.countDocuments({ is_deleted: false }),
    Blog.countDocuments({ is_published: false, is_deleted: false }),
    Blog.countDocuments({ $or: [{ seo_title: { $in: [null, ''] } }, { seo_title: { $exists: false } }], is_deleted: false }),
    Blog.countDocuments({ $or: [{ meta_description: { $in: [null, ''] } }, { meta_description: { $exists: false } }], is_deleted: false }),
  ]);

  const blogs = await Blog.find({ is_deleted: false })
    .select(SAFE_BLOG_FIELDS)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    data: blogs as unknown as Record<string, unknown>[],
    summary: { total, unpublished, missing_seo_title: missingSeoTitle, missing_meta_description: missingMeta, critical: missingSeoTitle + missingMeta },
    fallbackAnswer: `${total} blogs. ${unpublished} unpublished. ${missingSeoTitle} missing SEO title, ${missingMeta} missing meta description.`,
  };
}

export async function getFAQsSummary(page: number, limit: number): Promise<ToolResult> {
  const [total, noAnswer, unpublished] = await Promise.all([
    FAQ.countDocuments({ is_deleted: false }),
    FAQ.countDocuments({ $or: [{ answer: { $in: [null, ''] } }, { answer: { $exists: false } }], is_deleted: false }),
    FAQ.countDocuments({ is_published: false, is_deleted: false }),
  ]);

  const faqs = await FAQ.find({ is_deleted: false })
    .select(SAFE_FAQ_FIELDS)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const enriched = await enrichFaqRows(faqs as unknown as Record<string, unknown>[]);

  return {
    data: enriched,
    summary: { total, no_answer: noAnswer, unpublished },
    fallbackAnswer: `${total} FAQs. ${noAnswer} missing answers. ${unpublished} unpublished.`,
  };
}

export async function getUsersSummary(page: number, limit: number): Promise<ToolResult> {
  const [total, admins, editors, viewers] = await Promise.all([
    User.countDocuments({ is_deleted: false }),
    User.countDocuments({ role: 'admin', is_deleted: false }),
    User.countDocuments({ role: 'editor', is_deleted: false }),
    User.countDocuments({ role: 'viewer', is_deleted: false }),
  ]);

  const users = await User.find({ is_deleted: false })
    .select(SAFE_USER_FIELDS)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    data: users as unknown as Record<string, unknown>[],
    summary: { total, admins, editors, viewers },
    fallbackAnswer: `${total} users: ${admins} admin, ${editors} editor, ${viewers} viewer.`,
  };
}

export async function getRecentErrors(page: number, limit: number): Promise<ToolResult> {
  const failedImports = await ImportLog.find({ status: 'failed' })
    .select(SAFE_IMPORT_FIELDS)
    .sort({ createdAt: -1 })
    .limit(MAX_ROWS)
    .lean();

  const recentAuditErrors = await AuditLog.find({ action: { $in: ['error', 'import_failed'] } } as any)
    .select('entity_type entity_id action details createdAt')
    .sort({ createdAt: -1 })
    .limit(MAX_ROWS)
    .lean();

  const combined = [
    ...failedImports.map(i => ({ ...(i as unknown as Record<string,unknown>), type: 'failed_import' })),
    ...recentAuditErrors.map(a => ({ ...(a as unknown as Record<string,unknown>), type: 'audit_error' })),
  ].sort((a, b) => {
    const dateA = (a as { createdAt?: Date }).createdAt;
    const dateB = (b as { createdAt?: Date }).createdAt;
    return (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0);
  });

  const paged = paginate(combined, page, limit);
  return {
    data: paged,
    summary: { total: combined.length, failed_imports: failedImports.length },
    fallbackAnswer: `${combined.length} recent errors found (${failedImports.length} failed imports).`,
  };
}

export async function getSystemHealth(page: number, limit: number): Promise<ToolResult> {
  const [
    totalCars, carsWithIssues,
    totalVariants, variantsWithIssues,
    failedImports, unmatchedImports,
  ] = await Promise.all([
    Car.countDocuments({ is_deleted: false }),
    Car.countDocuments({
      is_deleted: false,
      $or: [
        { brand_id: { $in: [null, ''] } },
        { seo_title: { $in: [null, ''] } },
      ],
    }),
    CarVariant.countDocuments({ is_deleted: false }),
    CarVariant.countDocuments({
      is_deleted: false,
      $or: [
        { ex_showroom_price: { $in: [null, 0] } },
        { fuel_type_id: { $in: [null, ''] } },
      ],
    }),
    ImportLog.countDocuments({ status: 'failed' }),
    ImportLog.countDocuments({ 'unmatched_data': { $ne: {} } }),
  ]);

  const healthScore = Math.round(
    (1 - (carsWithIssues + variantsWithIssues) / Math.max(totalCars + totalVariants, 1)) * 100,
  );

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
    data: [summary as unknown as Record<string, unknown>],
    summary,
    fallbackAnswer: `System health score: ${healthScore}%. ${carsWithIssues} cars and ${variantsWithIssues} variants have issues. ${failedImports} failed imports.`,
  };
}

export async function searchByCarName(name: string, page: number, limit: number): Promise<ToolResult> {
  const query = { name: new RegExp(name, 'i'), is_deleted: false };
  const total = await Car.countDocuments(query);
  const cars = await Car.find(query)
    .select(SAFE_CAR_FIELDS)
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const enriched = await enrichCarRows(cars as unknown as Record<string, unknown>[]);
  return {
    data: enriched,
    summary: { total },
    fallbackAnswer: total === 0
      ? `No cars found matching "${name}".`
      : `Found ${total} car${total > 1 ? 's' : ''} matching "${name}".`,
  };
}

export async function searchByVariantName(name: string, carNameOrId: string | undefined, page: number, limit: number): Promise<ToolResult> {
  const query: Record<string, unknown> = { name: new RegExp(name, 'i'), is_deleted: false };
  if (carNameOrId) {
    const car = await Car.findOne({ name: new RegExp(carNameOrId, 'i'), is_deleted: false }).select('car_id').lean();
    if (car) query.car_id = (car as { car_id: string }).car_id;
  }
  const total = await CarVariant.countDocuments(query);
  const variants = await CarVariant.find(query)
    .select(SAFE_VARIANT_FIELDS)
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const enriched = await enrichVariantRows(variants as unknown as Record<string, unknown>[]);
  return {
    data: enriched,
    summary: { total },
    fallbackAnswer: total === 0 ? `No variants found matching "${name}".` : `Found ${total} variants matching "${name}".`,
  };
}

export async function findCarForAction(name: string, action: ChatbotWriteAction): Promise<ToolResult> {
  const cars = await Car.find({ name: new RegExp(name, 'i'), is_deleted: false })
    .select(SAFE_CAR_FIELDS)
    .limit(5)
    .lean();

  if (!cars.length) {
    return { data: [], summary: {}, fallbackAnswer: `Could not find a car matching "${name}". Try the exact car name.` };
  }

  const enriched = await enrichCarRows(cars as unknown as Record<string, unknown>[]);
  const car = cars[0] as { car_id: string; name: string; is_published: boolean };
  const targetState = action === 'publish';

  if (car.is_published === targetState) {
    return {
      data: enriched,
      summary: { total: cars.length },
      fallbackAnswer: `"${car.name}" is already ${action === 'publish' ? 'published' : 'unpublished'}.`,
    };
  }

  const proposal: ActionProposal = {
    action,
    entity_type: 'car',
    entity_id: car.car_id,
    entity_name: car.name,
    label: `${action === 'publish' ? 'Publish' : 'Unpublish'} "${car.name}"`,
    current_state: car.is_published,
    warning: action === 'publish'
      ? 'This car will be visible to users on the public site.'
      : 'This car will be hidden from the public site.',
  };

  return {
    data: enriched,
    summary: { total: cars.length },
    fallbackAnswer: `Found "${car.name}". Ready to ${action}.`,
    action_proposal: proposal,
  };
}

export async function findVariantForAction(name: string, action: ChatbotWriteAction): Promise<ToolResult> {
  const variants = await CarVariant.find({ name: new RegExp(name, 'i'), is_deleted: false })
    .select(SAFE_VARIANT_FIELDS)
    .limit(5)
    .lean();

  if (!variants.length) {
    return { data: [], summary: {}, fallbackAnswer: `Could not find a variant matching "${name}".` };
  }

  const enriched = await enrichVariantRows(variants as unknown as Record<string, unknown>[]);
  const v = variants[0] as unknown as { variant_id: string; name: string; is_published: boolean };
  const targetState = action === 'publish';

  if (v.is_published === targetState) {
    return {
      data: enriched,
      summary: { total: variants.length },
      fallbackAnswer: `"${v.name}" is already ${action === 'publish' ? 'published' : 'unpublished'}.`,
    };
  }

  const proposal: ActionProposal = {
    action,
    entity_type: 'variant',
    entity_id: v.variant_id,
    entity_name: v.name,
    label: `${action === 'publish' ? 'Publish' : 'Unpublish'} variant "${v.name}"`,
    current_state: v.is_published,
    warning: action === 'publish'
      ? 'This variant will appear on the car page.'
      : 'This variant will be hidden from the car page.',
  };

  return {
    data: enriched,
    summary: { total: variants.length },
    fallbackAnswer: `Found variant "${v.name}". Ready to ${action}.`,
    action_proposal: proposal,
  };
}

export async function getCitySummary(page: number, limit: number): Promise<ToolResult> {
  const total = await City.countDocuments({});
  const cities = await City.find({})
    .select('city_id name slug is_active')
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const activeCount = await City.countDocuments({ is_active: true });

  return {
    data: cities as unknown as Record<string, unknown>[],
    summary: { total, active: activeCount, inactive: total - activeCount },
    fallbackAnswer: `${total} cities in the system. ${activeCount} active, ${total - activeCount} inactive.`,
  };
}

export async function getRankingSummary(page: number, limit: number): Promise<ToolResult> {
  const total = await RankingScore.countDocuments({});
  const topRanked = await RankingScore.find({})
    .select('car_id composite_score buyer_intent_score trending_score popular_score updatedAt')
    .sort({ composite_score: -1 })
    .limit(limit)
    .lean();

  const carIds = topRanked.map((r: any) => r.car_id).filter(Boolean);
  const cars = await Car.find({ car_id: { $in: carIds }, is_deleted: false }).select('car_id name').lean();
  const carMap: Record<string, string> = {};
  (cars as { car_id: string; name: string }[]).forEach(c => { carMap[c.car_id] = c.name; });

  const enriched = topRanked.map((r: any) => ({
    car: carMap[r.car_id] ?? '—',
    composite_score: r.composite_score != null ? Math.round(r.composite_score * 100) / 100 : '—',
    buyer_intent: r.buyer_intent_score != null ? Math.round(r.buyer_intent_score * 100) / 100 : '—',
    trending: r.trending_score != null ? Math.round(r.trending_score * 100) / 100 : '—',
    popular: r.popular_score != null ? Math.round(r.popular_score * 100) / 100 : '—',
    updated: r.updatedAt,
  }));

  return {
    data: enriched,
    summary: { total },
    fallbackAnswer: `Top ${topRanked.length} ranked cars shown out of ${total} total ranking records.`,
  };
}

export async function getSeoCollectionSummary(page: number, limit: number): Promise<ToolResult> {
  const total = await SeoCollection.countDocuments({ is_deleted: false });
  const published = await SeoCollection.countDocuments({ is_published: true, is_deleted: false });
  const collections = await SeoCollection.find({ is_deleted: false })
    .select('collection_id title slug is_published car_count createdAt')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    data: collections as unknown as Record<string, unknown>[],
    summary: { total, published, unpublished: total - published },
    fallbackAnswer: `${total} SEO collections. ${published} published, ${total - published} unpublished.`,
  };
}

export async function getPopularCollectionSummary(page: number, limit: number): Promise<ToolResult> {
  const total = await PopularCollection.countDocuments({ is_deleted: false });
  const published = await PopularCollection.countDocuments({ is_published: true, is_deleted: false });
  const collections = await PopularCollection.find({ is_deleted: false })
    .select('collection_id title slug is_published view_all_path createdAt')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    data: collections as unknown as Record<string, unknown>[],
    summary: { total, published, unpublished: total - published },
    fallbackAnswer: `${total} popular collections. ${published} published, ${total - published} unpublished.`,
  };
}

export async function performWriteAction(
  action: ChatbotWriteAction,
  entity_type: 'car' | 'variant',
  entity_id: string,
): Promise<{ success: boolean; message: string; entity_name: string }> {
  const newPublishedState = action === 'publish';

  if (entity_type === 'car') {
    const car = await Car.findOneAndUpdate(
      { car_id: entity_id, is_deleted: false },
      { is_published: newPublishedState },
      { new: true },
    ).select('name').lean();

    if (!car) throw new Error('Car not found');
    const name = (car as unknown as { name: string }).name;
    return { success: true, message: `"${name}" has been ${action === 'publish' ? 'published' : 'unpublished'} successfully.`, entity_name: name };
  }

  if (entity_type === 'variant') {
    const variant = await CarVariant.findOneAndUpdate(
      { variant_id: entity_id, is_deleted: false },
      { is_published: newPublishedState },
      { new: true },
    ).select('name').lean();

    if (!variant) throw new Error('Variant not found');
    const name = (variant as unknown as { name: string }).name;
    return { success: true, message: `Variant "${name}" has been ${action === 'publish' ? 'published' : 'unpublished'} successfully.`, entity_name: name };
  }

  throw new Error('Unknown entity type');
}
