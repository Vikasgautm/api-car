import { v4 as uuidv4 } from 'uuid';
import { ITagCategory, TagCategory } from '../../../models/tag-category.model';
import { Tag } from '../../../models/tag.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { FilterUtil } from '../../../shared/utils/filter.util';
import { PaginationUtil } from '../../../shared/utils/pagination.util';
import { SlugUtil } from '../../../shared/utils/slug.util';

export class TagCategoryService {
  static async getAll(filterDto: any, includeDeleted = false) {
    const {
      page = 1,
      limit = 50,
      q,
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
    if (type) filter.type = type;

    if (q) {
      Object.assign(filter, FilterUtil.buildSearchFilter(['name', 'description'], q));
    }

    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);
    const sortFilter = FilterUtil.buildSortFilter(sortBy, sortOrder);

    const [categories, total] = await Promise.all([
      TagCategory.find(filter).sort(sortFilter).skip(skip).limit(validatedLimit).lean(),
      TagCategory.countDocuments(filter),
    ]);

    return {
      categories,
      pagination: PaginationUtil.createPaginationMeta(page, validatedLimit, total),
    };
  }

  static async getById(tagCategoryId: string) {
    return TagCategory.findOne({ tag_category_id: tagCategoryId, is_deleted: false });
  }

  static async getBySlug(slug: string) {
    return TagCategory.findOne({ slug, is_deleted: false });
  }

  static async create(data: any) {
    const tag_category_id = uuidv4();
    const baseSlug = SlugUtil.generate(data.name);
    const existingSlug = await TagCategory.findOne({ slug: baseSlug, is_deleted: false });
    let slug = baseSlug;
    if (existingSlug) {
      const pattern = new RegExp(`^${baseSlug}(-\\d+)?$`);
      const matchingSlugs = (
        await TagCategory.find({ slug: pattern, is_deleted: false }).select('slug').lean()
      ).map((c: any) => c.slug);
      slug = SlugUtil.generateUnique(data.name, matchingSlugs);
    }

    const doc: Partial<ITagCategory> = {
      tag_category_id,
      name: data.name,
      slug,
      type: data.type,
      description: data.description,
      is_published: data.is_published !== undefined ? data.is_published : true,
      sort_order: data.sort_order ?? 0,
      is_deleted: false,
    };

    return TagCategory.create(doc);
  }

  static async update(tagCategoryId: string, data: any) {
    const updateData: Partial<ITagCategory> = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
      const newSlug = SlugUtil.generate(data.name);
      const conflict = await TagCategory.findOne({
        slug: newSlug,
        tag_category_id: { $ne: tagCategoryId },
        is_deleted: false,
      } as any);
      if (!conflict) updateData.slug = newSlug;
    }
    if (data.type !== undefined) updateData.type = data.type;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.is_published !== undefined) updateData.is_published = data.is_published;
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;

    const updated = await TagCategory.findOneAndUpdate(
      { tag_category_id: tagCategoryId, is_deleted: false } as any,
      updateData,
      { returnDocument: 'after' }
    );

    if (!updated) {
      throw new AppError(`Tag category not found: ${tagCategoryId}`, 404);
    }

    return updated;
  }

  static async softDelete(tagCategoryId: string) {
    const tagsInCategory = await Tag.countDocuments({ tag_category_id: tagCategoryId, is_deleted: false });
    if (tagsInCategory > 0) {
      throw new AppError(
        `Cannot delete tag category: ${tagsInCategory} tag(s) still belong to it. Delete or move those tags first.`,
        400
      );
    }

    const updated = await TagCategory.findOneAndUpdate(
      { tag_category_id: tagCategoryId, is_deleted: false },
      { is_deleted: true },
      { returnDocument: 'after' }
    );

    if (!updated) {
      throw new AppError(`Tag category not found: ${tagCategoryId}`, 404);
    }
    return updated;
  }

  static async restore(tagCategoryId: string) {
    const updated = await TagCategory.findOneAndUpdate(
      { tag_category_id: tagCategoryId, is_deleted: true },
      { is_deleted: false },
      { returnDocument: 'after' }
    );

    if (!updated) {
      throw new AppError(`Tag category not found in deleted records: ${tagCategoryId}`, 404);
    }
    return updated;
  }
}
