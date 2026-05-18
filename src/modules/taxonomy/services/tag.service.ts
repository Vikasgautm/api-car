import { v4 as uuidv4 } from 'uuid';
import { TagCategory } from '../../../models/tag-category.model';
import { ITag, Tag } from '../../../models/tag.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { FilterUtil } from '../../../shared/utils/filter.util';
import { PaginationUtil } from '../../../shared/utils/pagination.util';
import { SlugUtil } from '../../../shared/utils/slug.util';

export class TagService {
  static async getAll(filterDto: any, includeDeleted = false) {
    const {
      page = 1,
      limit = 50,
      q,
      tag_category_id,
      tag_category_slug,
      type,
      is_published,
      is_deleted,
      sortBy = 'sort_order',
      sortOrder = 'asc',
    } = filterDto;

    const filter: Record<string, unknown> = {};

    if (is_deleted === 'true' || is_deleted === true) {
      filter.is_deleted = true;
    } else if (!includeDeleted) {
      filter.is_deleted = false;
    }

    if (is_published !== undefined) filter.is_published = is_published;

    if (tag_category_id) {
      filter.tag_category_id = tag_category_id;
    } else if (tag_category_slug || type) {
      const catFilter: Record<string, unknown> = { is_deleted: false };
      if (tag_category_slug) catFilter.slug = tag_category_slug;
      if (type) catFilter.type = type;
      const matchingCategoryIds = await TagCategory.find(catFilter).distinct('tag_category_id');
      filter.tag_category_id = { $in: matchingCategoryIds };
    }

    if (q) {
      Object.assign(filter, FilterUtil.buildSearchFilter(['name', 'description'], q));
    }

    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);
    const sortFilter = FilterUtil.buildSortFilter(sortBy, sortOrder);

    const [tags, total] = await Promise.all([
      Tag.find(filter).sort(sortFilter).skip(skip).limit(validatedLimit).lean(),
      Tag.countDocuments(filter),
    ]);

    return {
      tags,
      pagination: PaginationUtil.createPaginationMeta(page, validatedLimit, total),
    };
  }

  static async getById(tagId: string) {
    return Tag.findOne({ tag_id: tagId, is_deleted: false });
  }

  static async getBySlug(slug: string) {
    return Tag.findOne({ slug, is_deleted: false });
  }

  static async create(data: any) {
    const category = await TagCategory.findOne({
      tag_category_id: data.tag_category_id,
      is_deleted: false,
    });
    if (!category) {
      throw new AppError(`Tag category not found: ${data.tag_category_id}`, 404);
    }

    const tag_id = uuidv4();
    const baseSlug = SlugUtil.generate(data.name);
    const existingSlug = await Tag.findOne({ slug: baseSlug, is_deleted: false });
    let slug = baseSlug;
    if (existingSlug) {
      const pattern = new RegExp(`^${baseSlug}(-\\d+)?$`);
      const matchingSlugs = (
        await Tag.find({ slug: pattern, is_deleted: false }).select('slug').lean()
      ).map((t: any) => t.slug);
      slug = SlugUtil.generateUnique(data.name, matchingSlugs);
    }

    const doc: Partial<ITag> = {
      tag_id,
      tag_category_id: data.tag_category_id,
      name: data.name,
      slug,
      description: data.description,
      seo_meta: data.seo_meta,
      is_published: data.is_published !== undefined ? data.is_published : true,
      sort_order: data.sort_order ?? 0,
      is_deleted: false,
    };

    return Tag.create(doc);
  }

  static async update(tagId: string, data: any) {
    if (data.tag_category_id !== undefined) {
      const category = await TagCategory.findOne({
        tag_category_id: data.tag_category_id,
        is_deleted: false,
      });
      if (!category) {
        throw new AppError(`Tag category not found: ${data.tag_category_id}`, 404);
      }
    }

    const updateData: Partial<ITag> = {};
    if (data.tag_category_id !== undefined) updateData.tag_category_id = data.tag_category_id;
    if (data.name !== undefined) {
      updateData.name = data.name;
      const newSlug = SlugUtil.generate(data.name);
      const conflict = await Tag.findOne({
        slug: newSlug,
        tag_id: { $ne: tagId },
        is_deleted: false,
      } as any);
      if (!conflict) updateData.slug = newSlug;
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.seo_meta !== undefined) updateData.seo_meta = data.seo_meta;
    if (data.is_published !== undefined) updateData.is_published = data.is_published;
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;

    const updated = await Tag.findOneAndUpdate(
      { tag_id: tagId, is_deleted: false } as any,
      updateData,
      { returnDocument: 'after' }
    );

    if (!updated) {
      throw new AppError(`Tag not found: ${tagId}`, 404);
    }
    return updated;
  }

  static async softDelete(tagId: string) {
    const updated = await Tag.findOneAndUpdate(
      { tag_id: tagId, is_deleted: false },
      { is_deleted: true },
      { returnDocument: 'after' }
    );

    if (!updated) {
      throw new AppError(`Tag not found: ${tagId}`, 404);
    }
    return updated;
  }

  static async restore(tagId: string) {
    const updated = await Tag.findOneAndUpdate(
      { tag_id: tagId, is_deleted: true },
      { is_deleted: false },
      { returnDocument: 'after' }
    );

    if (!updated) {
      throw new AppError(`Tag not found in deleted records: ${tagId}`, 404);
    }
    return updated;
  }

  static async validateTagIds(tagIds: string[]): Promise<{ valid: string[]; invalid: string[] }> {
    if (!tagIds || tagIds.length === 0) {
      return { valid: [], invalid: [] };
    }
    const found = await Tag.find({
      tag_id: { $in: tagIds },
      is_deleted: false,
    }).distinct('tag_id');
    const foundSet = new Set(found);
    return {
      valid: tagIds.filter(id => foundSet.has(id)),
      invalid: tagIds.filter(id => !foundSet.has(id)),
    };
  }
}
