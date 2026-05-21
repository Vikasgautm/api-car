import { v4 as uuidv4 } from 'uuid';
import { BodyType } from '../../../models/body-type.model';
import { FuelType } from '../../../models/fuel-type.model';
import { ISeoCollection, SeoCollection } from '../../../models/seo-collection.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { PaginationUtil } from '../../../shared/utils/pagination.util';
import { DiscoveryService } from '../../discovery/services/discovery.service';
import { RelatedCollectionsService } from './related-collections.service';
import { SeoCombinationValidatorService } from './seo-combination-validator.service';
import { SeoCollectionContentService } from './seo-collection-content.service';
import { SeoCollectionHealthService } from './seo-collection-health.service';
import { SeoCollectionQueryService } from './seo-collection-query.service';
import { SeoFaqService } from './seo-faq.service';
import { SeoSlugService } from './seo-slug.service';

export class SeoCollectionService {
  static async list(params: {
    page?: number;
    limit?: number;
    q?: string;
    collection_type?: string;
    status?: string;
    seo_index_status?: string;
    include_deleted?: boolean | string;
  }) {
    const filter: Record<string, unknown> = {};
    if (params.include_deleted !== 'true' && params.include_deleted !== true) {
      filter.is_deleted = false;
    }
    if (params.q) filter.title = { $regex: params.q, $options: 'i' };
    if (params.collection_type) filter.collection_type = params.collection_type;
    if (params.status) filter.status = params.status;
    if (params.seo_index_status) filter.seo_index_status = params.seo_index_status;

    const pageNum = Number(params.page ?? 1);
    const limitNum = Number(params.limit ?? 25);
    const { skip, limit } = PaginationUtil.getPaginationParams(pageNum, limitNum);

    const [rows, total] = await Promise.all([
      SeoCollection.find(filter)
        .sort({ priority_score: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SeoCollection.countDocuments(filter),
    ]);

    return { collections: rows, pagination: PaginationUtil.createPaginationMeta(pageNum, limit, total) };
  }

  static async getById(collection_id: string) {
    const collection = await SeoCollection.findOne({ collection_id, is_deleted: false }).lean();
    if (!collection) throw new AppError(`SEO collection not found: ${collection_id}`, 404);
    return collection;
  }

  static async getBySlug(slug: string) {
    return SeoCollection.findOne({ slug, is_deleted: false, status: 'published' }).lean();
  }

  static async create(data: any, userId?: string) {
    // Resolve fuel + body slugs for combination validation
    const fuelSlugs: string[] = data.fuel_type_ids?.length
      ? (await FuelType.find({ fuel_type_id: { $in: data.fuel_type_ids } }).select('slug').lean()).map((f: any) => f.slug)
      : [];
    const bodySlugs: string[] = data.body_type_ids?.length
      ? (await BodyType.find({ body_type_id: { $in: data.body_type_ids } }).select('slug').lean()).map((b: any) => b.slug)
      : [];

    const validation = SeoCombinationValidatorService.validate({ fuel_type_slugs: fuelSlugs, body_type_slugs: bodySlugs });
    if (!validation.valid) throw new AppError(validation.reason!, 422);

    // Slug
    const slug = data.slug
      ? await SeoSlugService.ensureUnique(data.slug)
      : await SeoSlugService.generate({
          collection_type: data.collection_type,
          fuel_type_ids: data.fuel_type_ids,
          body_type_ids: data.body_type_ids,
          brand_ids: data.brand_ids,
          transmission_types: data.transmission_types,
          budget_max: data.budget_max,
          mileage_classes: data.mileage_classes,
        });

    // Discovery query + car count
    const generatedQuery = await SeoCollectionQueryService.buildDiscoveryFilters(data);
    const discoveryResult = await DiscoveryService.discover({ ...generatedQuery, limit: 1 } as any);
    const matched_car_count = (discoveryResult as any).pagination?.total ?? 0;

    // SEO content
    let seo = { ...(data.seo ?? {}) };
    if (data.auto_generate_content) {
      const generated = await SeoCollectionContentService.generateAll(data);
      seo = { ...generated, ...seo };
    }

    // FAQs
    let faq_items = data.faq_items ?? [];
    if (!faq_items.length && data.auto_generate_faqs) {
      faq_items = await SeoFaqService.generateFaqs(data.collection_type, {
        fuel_type_ids: data.fuel_type_ids,
        body_type_ids: data.body_type_ids,
        budget_max: data.budget_max,
        transmission_types: data.transmission_types,
        mileage_classes: data.mileage_classes,
      });
    }

    // Health
    const health = await SeoCollectionHealthService.computeHealth({
      matched_car_count,
      seo,
      faq_items,
      slug,
      fuel_type_ids: data.fuel_type_ids ?? [],
      body_type_ids: data.body_type_ids ?? [],
      budget_min: data.budget_min,
      budget_max: data.budget_max,
    });

    const collection = await SeoCollection.create({
      collection_id: uuidv4(),
      title: data.title,
      slug,
      collection_type: data.collection_type,
      primary_keyword: data.primary_keyword ?? null,

      fuel_type_ids: data.fuel_type_ids ?? [],
      body_type_ids: data.body_type_ids ?? [],
      brand_ids: data.brand_ids ?? [],

      transmission_types: data.transmission_types ?? [],
      seating_capacities: data.seating_capacities ?? [],
      feature_flags: data.feature_flags ?? [],
      mileage_classes: data.mileage_classes ?? [],

      budget_min: data.budget_min ?? null,
      budget_max: data.budget_max ?? null,

      usage_intents: data.usage_intents ?? [],
      ownership_intents: data.ownership_intents ?? [],
      safety_intents: data.safety_intents ?? [],
      family_intents: data.family_intents ?? [],

      generated_query: generatedQuery,
      matched_car_count,
      related_collection_ids: [],

      seo,
      faq_items,

      seo_index_status: health.seo_index_status,
      auto_noindex: health.auto_noindex,

      health_score: health.health_score,
      duplicate_risk_score: health.duplicate_risk_score,
      overlap_percentage: 0,

      featured_rank: data.featured_rank ?? null,
      priority_score: data.priority_score ?? 0,

      auto_generated: data.auto_generated ?? false,
      last_refreshed_at: new Date(),

      status: data.status ?? 'draft',
      is_deleted: false,
      created_by: userId ?? null,
      updated_by: userId ?? null,
    });

    // Fire-and-forget related backfill
    this._refreshRelated(collection.collection_id).catch(() => null);

    return collection;
  }

  static async update(collection_id: string, data: any, userId?: string) {
    const existing = await SeoCollection.findOne({ collection_id, is_deleted: false });
    if (!existing) throw new AppError(`SEO collection not found: ${collection_id}`, 404);

    const update: Partial<ISeoCollection> & Record<string, any> = {};

    if (data.title !== undefined) update.title = data.title;

    if (data.slug !== undefined) {
      update.slug = await SeoSlugService.ensureUnique(data.slug, collection_id);
    }

    const dimensionFields = [
      'collection_type', 'primary_keyword',
      'fuel_type_ids', 'body_type_ids', 'brand_ids',
      'transmission_types', 'seating_capacities', 'feature_flags', 'mileage_classes',
      'budget_min', 'budget_max',
      'usage_intents', 'ownership_intents', 'safety_intents', 'family_intents',
    ] as const;

    for (const field of dimensionFields) {
      if (data[field] !== undefined) update[field] = data[field];
    }

    if (data.seo !== undefined) update.seo = { ...existing.seo, ...data.seo };
    if (data.faq_items !== undefined) update.faq_items = data.faq_items;
    if (data.status !== undefined) update.status = data.status;
    if (data.seo_index_status !== undefined) update.seo_index_status = data.seo_index_status;
    if (data.featured_rank !== undefined) update.featured_rank = data.featured_rank;
    if (data.priority_score !== undefined) update.priority_score = data.priority_score;

    update.updated_by = userId ?? null;

    // Rebuild query if any dimension changed
    const dimensionChanged = dimensionFields.some(f => data[f] !== undefined);
    if (dimensionChanged) {
      const merged = { ...existing.toObject(), ...update };
      update.generated_query = await SeoCollectionQueryService.buildDiscoveryFilters(merged);
      const result = await DiscoveryService.discover({ ...update.generated_query, limit: 1 } as any);
      update.matched_car_count = (result as any).pagination?.total ?? 0;
      update.last_refreshed_at = new Date();
    }

    await SeoCollection.findOneAndUpdate({ collection_id, is_deleted: false }, update, { new: true });

    // Refresh health
    await SeoCollectionHealthService.refreshCollection(collection_id);

    return SeoCollection.findOne({ collection_id }).lean();
  }

  static async softDelete(collection_id: string) {
    const updated = await SeoCollection.findOneAndUpdate(
      { collection_id, is_deleted: false },
      { is_deleted: true, deleted_at: new Date() },
      { returnDocument: 'after' }
    );
    if (!updated) throw new AppError(`SEO collection not found: ${collection_id}`, 404);
    return updated;
  }

  static async refresh(collection_id: string) {
    const collection = await SeoCollection.findOne({ collection_id, is_deleted: false });
    if (!collection) throw new AppError(`SEO collection not found: ${collection_id}`, 404);

    const filters = await SeoCollectionQueryService.buildDiscoveryFilters(collection);
    const result = await DiscoveryService.discover({ ...filters, limit: 1 } as any);
    const matched_car_count = (result as any).pagination?.total ?? 0;

    await SeoCollection.updateOne(
      { collection_id },
      { matched_car_count, generated_query: filters, last_refreshed_at: new Date() }
    );

    await SeoCollectionHealthService.refreshCollection(collection_id);
    await this._refreshRelated(collection_id);

    return SeoCollection.findOne({ collection_id }).lean();
  }

  static async hydrate(slug: string, page?: number) {
    const collection = await this.getBySlug(slug);
    if (!collection) throw AppError.notFound('SEO collection', 'slug', slug);

    const filters = await SeoCollectionQueryService.buildDiscoveryFilters(collection);
    if (page) (filters as any).page = page;

    const discoveryResult = await DiscoveryService.discover(filters);
    return { collection, ...discoveryResult };
  }

  static async generateContent(collection_id: string) {
    const collection = await this.getById(collection_id);
    const [content, faqs] = await Promise.all([
      SeoCollectionContentService.generateAll(collection),
      SeoFaqService.generateFaqs(collection.collection_type, {
        fuel_type_ids: collection.fuel_type_ids,
        body_type_ids: collection.body_type_ids,
        budget_max: collection.budget_max,
        transmission_types: collection.transmission_types,
        mileage_classes: collection.mileage_classes,
      }),
    ]);

    await SeoCollection.updateOne(
      { collection_id },
      { seo: { ...collection.seo, ...content }, faq_items: faqs }
    );

    return SeoCollection.findOne({ collection_id }).lean();
  }

  static async getHealth(params: {
    page?: number;
    limit?: number;
    issue_type?: string;
  }) {
    const filter: Record<string, unknown> = { is_deleted: false };

    switch (params.issue_type) {
      case 'low_count':
        filter.matched_car_count = { $lt: 3 };
        break;
      case 'noindex':
        filter.seo_index_status = 'noindex';
        break;
      case 'low_health':
        filter.health_score = { $lt: 50 };
        break;
      case 'duplicate':
        filter.duplicate_risk_score = { $gte: 50 };
        break;
      case 'stale': {
        const stale = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filter.last_refreshed_at = { $lt: stale };
        break;
      }
    }

    const pageNum = Number(params.page ?? 1);
    const limitNum = Number(params.limit ?? 25);
    const { skip, limit } = PaginationUtil.getPaginationParams(pageNum, limitNum);

    const [rows, total] = await Promise.all([
      SeoCollection.find(filter).sort({ health_score: 1 }).skip(skip).limit(limit).lean(),
      SeoCollection.countDocuments(filter),
    ]);

    return { collections: rows, pagination: PaginationUtil.createPaginationMeta(pageNum, limit, total) };
  }

  static async getHealthSummary() {
    const stale = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [total, noindex, low_count, low_health, duplicate, stale_count] = await Promise.all([
      SeoCollection.countDocuments({ is_deleted: false }),
      SeoCollection.countDocuments({ is_deleted: false, seo_index_status: 'noindex' }),
      SeoCollection.countDocuments({ is_deleted: false, matched_car_count: { $lt: 3 } }),
      SeoCollection.countDocuments({ is_deleted: false, health_score: { $lt: 50 } }),
      SeoCollection.countDocuments({ is_deleted: false, duplicate_risk_score: { $gte: 50 } }),
      SeoCollection.countDocuments({ is_deleted: false, last_refreshed_at: { $lt: stale } }),
    ]);
    return { total, noindex, low_count, low_health, duplicate, stale: stale_count };
  }

  static async previewQuery(data: any) {
    const filters = await SeoCollectionQueryService.buildDiscoveryFilters(data);
    const result = await DiscoveryService.discover({ ...filters, limit: 6 } as any);
    return result;
  }

  private static async _refreshRelated(collection_id: string) {
    const collection = await SeoCollection.findOne({ collection_id, is_deleted: false });
    if (!collection) return;
    const related = await RelatedCollectionsService.findRelated(collection);
    await SeoCollection.updateOne({ collection_id }, { related_collection_ids: related });
  }
}
