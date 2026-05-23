import { v4 as uuidv4 } from "uuid";
import { ERROR_CODES, USER_MESSAGES } from "../../../constants/errorMessages";
import { Car } from "../../../models/car.model";
import { CarVariant } from "../../../models/car-variant.model";
import { SeoCollection } from "../../../models/seo-collection.model";
import { BodyType, IBodyType } from "../../../models/body-type.model";
import { AppError } from "../../../shared/utils/app-error.util";
import { FilterUtil } from "../../../shared/utils/filter.util";
import { PaginationUtil } from "../../../shared/utils/pagination.util";
import { SlugUtil } from "../../../shared/utils/slug.util";

const SEO_FIELDS = ['slug', 'seo_title', 'meta_description', 'intro_content', 'short_description', 'hero_image'];

function computeSeoCompleteness(bt: any): { score: number; missing: string[] } {
  const missing: string[] = [];
  if (!bt.slug) missing.push('slug');
  if (!bt.seo_title) missing.push('seo_title');
  if (!bt.meta_description) missing.push('meta_description');
  if (!bt.intro_content) missing.push('intro_content');
  if (!bt.short_description) missing.push('short_description');
  if (!bt.hero_image?.url) missing.push('hero_image');
  const score = Math.round(((SEO_FIELDS.length - missing.length) / SEO_FIELDS.length) * 100);
  return { score, missing };
}

export class BodyTypeService {
  static async getAllBodyTypes(filterDto: any, includeDeleted: boolean = false) {
    const {
      page = 1,
      limit = 10,
      q,
      is_published,
      is_featured,
      is_deleted,
      has_cars,
      missing_seo,
      parent_only,
      child_only,
      sortBy = 'sort_order',
      sortOrder = 'asc',
    } = filterDto;

    const filter: Record<string, unknown> = {};

    if (is_deleted === 'true' || is_deleted === true) {
      filter.is_deleted = true;
    } else if (!includeDeleted) {
      filter.is_deleted = false;
    }

    if (is_published !== undefined && is_published !== '') {
      filter.is_published = is_published === 'true' || is_published === true;
    }

    if (is_featured !== undefined && is_featured !== '') {
      filter.is_featured = is_featured === 'true' || is_featured === true;
    }

    if (parent_only === 'true') {
      (filter as any).$or = [{ parent_id: null }, { parent_id: { $exists: false } }];
    }

    if (child_only === 'true') {
      filter.parent_id = { $ne: null, $exists: true, $gt: '' } as any;
    }

    if (missing_seo === 'true') {
      (filter as any).$or = [
        { seo_title: { $in: [null, ''] } },
        { meta_description: { $in: [null, ''] } },
        { intro_content: { $in: [null, ''] } },
        { short_description: { $in: [null, ''] } },
        { 'hero_image.url': { $in: [null, ''] } },
        { hero_image: { $exists: false } },
      ];
    }

    if (q) {
      const searchFilter = FilterUtil.buildSearchFilter(['name', 'description', 'seo_title'], q);
      Object.assign(filter, searchFilter);
    }

    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);
    const sortFilter = FilterUtil.buildSortFilter(sortBy, sortOrder);

    let bodyTypeIds: string[] | null = null;

    // Filter by has_cars / without_cars
    if (has_cars === 'true' || has_cars === 'false') {
      const carBodyTypeIds = await Car.distinct('body_type_id', { is_deleted: false }) as string[];
      if (has_cars === 'true') {
        filter.body_type_id = { $in: carBodyTypeIds };
      } else {
        filter.body_type_id = { $nin: carBodyTypeIds };
      }
    }

    const [bodyTypesRaw, total] = await Promise.all([
      BodyType.find(filter).sort(sortFilter).skip(skip).limit(validatedLimit).lean(),
      BodyType.countDocuments(filter),
    ]);

    bodyTypeIds = bodyTypesRaw.map((bt: any) => bt.body_type_id);

    // Fetch car counts and variant counts in batch
    const [carCountsRaw, variantCountsRaw, seoCountsRaw] = await Promise.all([
      Car.aggregate([
        { $match: { body_type_id: { $in: bodyTypeIds }, is_deleted: false } },
        { $group: { _id: '$body_type_id', count: { $sum: 1 } } },
      ]),
      Car.aggregate([
        { $match: { body_type_id: { $in: bodyTypeIds }, is_deleted: false } },
        {
          $lookup: {
            from: 'carvariants',
            localField: 'car_id',
            foreignField: 'car_id',
            as: 'variants',
          },
        },
        { $group: { _id: '$body_type_id', count: { $sum: { $size: '$variants' } } } },
      ]),
      SeoCollection.aggregate([
        { $match: { body_type_ids: { $in: bodyTypeIds } } },
        { $unwind: '$body_type_ids' },
        { $match: { body_type_ids: { $in: bodyTypeIds } } },
        { $group: { _id: '$body_type_ids', count: { $sum: 1 } } },
      ]),
    ]);

    const carCountMap = new Map(carCountsRaw.map((r: any) => [r._id, r.count]));
    const variantCountMap = new Map(variantCountsRaw.map((r: any) => [r._id, r.count]));
    const seoCountMap = new Map(seoCountsRaw.map((r: any) => [r._id, r.count]));

    const bodyTypes = bodyTypesRaw.map((bt: any) => {
      const seo = computeSeoCompleteness(bt);
      return {
        ...bt,
        car_count: carCountMap.get(bt.body_type_id) || 0,
        variant_count: variantCountMap.get(bt.body_type_id) || 0,
        seo_collection_count: seoCountMap.get(bt.body_type_id) || 0,
        seo_completeness: seo.score,
        seo_missing_fields: seo.missing,
      };
    });

    const paginationMeta = PaginationUtil.createPaginationMeta(page, validatedLimit, total);

    return { bodyTypes, pagination: paginationMeta };
  }

  static async getStats() {
    const [total, published, draft, archived, missingImages] = await Promise.all([
      BodyType.countDocuments({ is_deleted: false }),
      BodyType.countDocuments({ is_deleted: false, is_published: true }),
      BodyType.countDocuments({ is_deleted: false, is_published: false }),
      BodyType.countDocuments({ is_deleted: true }),
      BodyType.countDocuments({
        is_deleted: false,
        $or: [
          { logo: { $exists: false } },
          { 'logo.url': { $in: [null, ''] } },
        ],
      }),
    ]);

    const missingSeo = await BodyType.countDocuments({
      is_deleted: false,
      $or: [
        { seo_title: { $in: [null, ''] } },
        { meta_description: { $in: [null, ''] } },
        { intro_content: { $in: [null, ''] } },
        { short_description: { $in: [null, ''] } },
        { 'hero_image.url': { $in: [null, ''] } },
        { hero_image: { $exists: false } },
      ],
    });

    const carBodyTypeIds = await Car.distinct('body_type_id', { is_deleted: false }) as string[];
    const withoutCars = await BodyType.countDocuments({
      is_deleted: false,
      body_type_id: { $nin: carBodyTypeIds },
    });

    return {
      total,
      published,
      draft,
      archived,
      without_cars: withoutCars,
      missing_seo: missingSeo,
      missing_images: missingImages,
    };
  }

  static async getArchiveImpact(bodyTypeId: string) {
    const [cars, seoCollections] = await Promise.all([
      Car.countDocuments({ body_type_id: bodyTypeId, is_deleted: false }),
      SeoCollection.countDocuments({ body_type_ids: bodyTypeId }),
    ]);

    const variants = await CarVariant.countDocuments({ car_id: { $in: await Car.distinct('car_id', { body_type_id: bodyTypeId, is_deleted: false }) } });

    // Discovery filters: if published, it appears in at least 1 discovery dimension
    const bt = await BodyType.findOne({ body_type_id: bodyTypeId, is_deleted: false }).lean();
    const discoveryFilters = bt && (bt as any).is_published ? 1 : 0;

    return { cars, variants, seo_collections: seoCollections, discovery_filters: discoveryFilters };
  }

  static async checkDuplicate(name: string, excludeId?: string) {
    const generatedSlug = SlugUtil.generate(name);
    const query: any = { is_deleted: false };
    if (excludeId) query.body_type_id = { $ne: excludeId };

    const [nameDupe, slugDupe] = await Promise.all([
      BodyType.findOne({ ...query, name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } }).lean(),
      BodyType.findOne({ ...query, slug: generatedSlug }).lean(),
    ]);

    return {
      has_duplicate: !!(nameDupe || slugDupe),
      name_duplicate: !!nameDupe,
      slug_duplicate: !!slugDupe,
      generated_slug: generatedSlug,
    };
  }

  static async bulkOperation(ids: string[], action: 'publish' | 'unpublish' | 'archive' | 'restore') {
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        switch (action) {
          case 'publish':
            return BodyType.updateOne({ body_type_id: id, is_deleted: false }, { is_published: true, published_at: new Date() });
          case 'unpublish':
            return BodyType.updateOne({ body_type_id: id, is_deleted: false }, { is_published: false });
          case 'archive':
            return BodyType.updateOne({ body_type_id: id }, { is_deleted: true });
          case 'restore':
            return BodyType.updateOne({ body_type_id: id, is_deleted: true }, { is_deleted: false });
        }
      })
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    return { succeeded, failed, total: ids.length };
  }

  static async reorderBodyTypes(items: { body_type_id: string; sort_order: number }[]) {
    const ops = items.map(({ body_type_id, sort_order }) => ({
      updateOne: {
        filter: { body_type_id },
        update: { $set: { sort_order } },
      },
    }));
    await BodyType.bulkWrite(ops);
    return { updated: items.length };
  }

  static async getBodyTypeById(bodyTypeId: string) {
    const bt = await BodyType.findOne({ body_type_id: bodyTypeId, is_deleted: false } as any).lean();
    if (!bt) return null;
    const seo = computeSeoCompleteness(bt);
    return { ...(bt as any), seo_completeness: seo.score, seo_missing_fields: seo.missing };
  }

  static async getBodyTypeBySlug(slug: string) {
    return await BodyType.findOne({ slug, is_deleted: false });
  }

  static async createBodyType(bodyTypeData: any) {
    const body_type_id = uuidv4();
    const slug = SlugUtil.generate(bodyTypeData.name);

    const existingSlug = await BodyType.findOne({ slug, is_deleted: false });
    if (existingSlug) {
      const baseSlug = slug;
      const pattern = new RegExp(`^${baseSlug}(-\\d+)?$`);
      const matchingSlugs = (
        await BodyType.find({ slug: pattern, is_deleted: false }).select('slug').lean()
      ).map((b: any) => b.slug);
      bodyTypeData.slug = SlugUtil.generateUnique(bodyTypeData.name, matchingSlugs);
    } else {
      bodyTypeData.slug = slug;
    }

    const bodyType: Partial<IBodyType> = {
      body_type_id,
      name: bodyTypeData.name,
      slug: bodyTypeData.slug,
      description: bodyTypeData.description,
      seo_title: bodyTypeData.seo_title,
      meta_description: bodyTypeData.meta_description,
      intro_content: bodyTypeData.intro_content,
      short_description: bodyTypeData.short_description,
      is_published: bodyTypeData.is_published || false,
      is_featured: bodyTypeData.is_featured || false,
      is_deleted: false,
      sort_order: bodyTypeData.sort_order || 0,
      parent_id: bodyTypeData.parent_id || null,
      related_body_types: bodyTypeData.related_body_types || [],
      created_by: bodyTypeData.created_by,
      updated_by: bodyTypeData.created_by,
    };

    if (bodyTypeData.logo_url) {
      bodyType.logo = {
        url: bodyTypeData.logo_url,
        title: bodyTypeData.logo_title || bodyTypeData.name,
      };
    }

    if (bodyTypeData.hero_image_url) {
      bodyType.hero_image = {
        url: bodyTypeData.hero_image_url,
        alt: bodyTypeData.hero_image_alt || bodyTypeData.name,
      };
    }

    if (bodyTypeData.is_published) {
      bodyType.published_at = new Date();
    }

    return await BodyType.create(bodyType);
  }

  static async updateBodyType(bodyTypeId: string, bodyTypeData: any) {
    const updateData: Partial<IBodyType> = {};

    if (bodyTypeData.name !== undefined) {
      updateData.name = bodyTypeData.name;
      const newSlug = SlugUtil.generate(bodyTypeData.name);
      const existingSlug = await BodyType.findOne({ slug: newSlug, body_type_id: { $ne: bodyTypeId }, is_deleted: false } as any);
      if (!existingSlug) {
        updateData.slug = newSlug;
      }
    }

    if (bodyTypeData.description !== undefined) updateData.description = bodyTypeData.description;
    if (bodyTypeData.seo_title !== undefined) updateData.seo_title = bodyTypeData.seo_title;
    if (bodyTypeData.meta_description !== undefined) updateData.meta_description = bodyTypeData.meta_description;
    if (bodyTypeData.intro_content !== undefined) updateData.intro_content = bodyTypeData.intro_content;
    if (bodyTypeData.short_description !== undefined) updateData.short_description = bodyTypeData.short_description;
    if (bodyTypeData.sort_order !== undefined) updateData.sort_order = bodyTypeData.sort_order;
    if (bodyTypeData.parent_id !== undefined) updateData.parent_id = bodyTypeData.parent_id;
    if (bodyTypeData.related_body_types !== undefined) updateData.related_body_types = bodyTypeData.related_body_types;
    if (bodyTypeData.updated_by !== undefined) updateData.updated_by = bodyTypeData.updated_by;

    const wasPublished = !!(bodyTypeData.is_published);
    if (bodyTypeData.is_published !== undefined) {
      updateData.is_published = bodyTypeData.is_published;
      if (wasPublished) {
        updateData.published_at = new Date();
      }
    }
    if (bodyTypeData.is_featured !== undefined) updateData.is_featured = bodyTypeData.is_featured;

    if (bodyTypeData.logo_url !== undefined) {
      if (bodyTypeData.logo_url) {
        updateData.logo = {
          url: bodyTypeData.logo_url,
          title: bodyTypeData.logo_title || bodyTypeData.name,
        };
      } else {
        updateData.logo = undefined;
      }
    }

    if (bodyTypeData.hero_image_url !== undefined) {
      if (bodyTypeData.hero_image_url) {
        updateData.hero_image = {
          url: bodyTypeData.hero_image_url,
          alt: bodyTypeData.hero_image_alt || bodyTypeData.name,
        };
      } else {
        updateData.hero_image = undefined;
      }
    }

    const bodyType = await BodyType.findOneAndUpdate(
      { body_type_id: bodyTypeId, is_deleted: false } as any,
      updateData,
      { returnDocument: 'after' }
    );

    if (!bodyType) {
      throw new AppError(
        `Body type not found or deleted for body_type_id: ${bodyTypeId}`,
        404,
        {
          userMessage: USER_MESSAGES.BODY_TYPE_NOT_FOUND,
          errorCode: ERROR_CODES.BODY_TYPE_NOT_FOUND,
          details: { field: 'body_type_id', reason: 'The body type does not exist or has been deleted.' },
        }
      );
    }

    return bodyType;
  }

  static async deleteBodyType(bodyTypeId: string) {
    const existingBodyType = await BodyType.findOne({ body_type_id: bodyTypeId });

    if (!existingBodyType) {
      throw new AppError(
        `Body type not found for body_type_id: ${bodyTypeId}`,
        404,
        {
          userMessage: USER_MESSAGES.BODY_TYPE_NOT_FOUND,
          errorCode: ERROR_CODES.BODY_TYPE_NOT_FOUND,
          details: { field: 'body_type_id', reason: 'The body type does not exist.' },
        }
      );
    }

    if (existingBodyType.is_deleted) return existingBodyType;

    const bodyType = await BodyType.findOneAndUpdate(
      { body_type_id: bodyTypeId, is_deleted: false },
      { is_deleted: true },
      { returnDocument: 'after' }
    );

    return bodyType;
  }

  static async restoreBodyType(bodyTypeId: string) {
    const bodyType = await BodyType.findOneAndUpdate(
      { body_type_id: bodyTypeId, is_deleted: true },
      { is_deleted: false },
      { returnDocument: 'after' }
    );

    if (!bodyType) {
      throw new AppError(
        `Body type not found for body_type_id: ${bodyTypeId}`,
        404,
        {
          userMessage: USER_MESSAGES.BODY_TYPE_NOT_FOUND,
          errorCode: ERROR_CODES.BODY_TYPE_NOT_FOUND,
          details: { field: 'body_type_id', reason: 'The body type does not exist in the deleted records.' },
        }
      );
    }

    return bodyType;
  }

  static async togglePublish(bodyTypeId: string) {
    const bodyType = await BodyType.findOne({ body_type_id: bodyTypeId, is_deleted: false });
    if (!bodyType) {
      throw new AppError(
        `Body type not found or deleted for body_type_id: ${bodyTypeId}`,
        404,
        {
          userMessage: USER_MESSAGES.BODY_TYPE_NOT_FOUND,
          errorCode: ERROR_CODES.BODY_TYPE_NOT_FOUND,
          details: { field: 'body_type_id', reason: 'The body type does not exist or has been deleted.' },
        }
      );
    }

    bodyType.is_published = !bodyType.is_published;
    if (bodyType.is_published && !bodyType.published_at) {
      bodyType.published_at = new Date();
    }
    await bodyType.save();

    return bodyType;
  }
}
