import { v4 as uuidv4 } from 'uuid';
import { IImageCategory, ImageCategory } from "../../../models/image-category.model";
import { AppError } from "../../../shared/utils/app-error.util";
import { FilterUtil } from "../../../shared/utils/filter.util";
import { PaginationUtil } from "../../../shared/utils/pagination.util";
import { SlugUtil } from "../../../shared/utils/slug.util";

export class ImageCategoryService {
  static async getAllImageCategories(filterDto: any, includeDeleted: boolean = false) {
    const {
      page = 1,
      limit = 10,
      is_active,
      is_deleted,
      q,
      sortBy = 'display_order',
      sortOrder = 'asc',
    } = filterDto;

    const filter: Record<string, unknown> = {};

    if (is_deleted === 'true' || is_deleted === true) {
      filter.is_deleted = true;
    } else if (!includeDeleted) {
      filter.is_deleted = false;
    }

    if (is_active !== undefined) filter.is_active = is_active === 'true';
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);
    const sortFilter = FilterUtil.buildSortFilter(sortBy, sortOrder);

    const categories = await ImageCategory.find(filter)
      .select('id category_id name slug description is_active display_order')
      .sort(sortFilter)
      .skip(skip)
      .limit(validatedLimit)
      .lean();

    const total = await ImageCategory.countDocuments(filter);
    const paginationMeta = PaginationUtil.createPaginationMeta(page, validatedLimit, total);

    return { categories, pagination: paginationMeta };
  }

  static async getImageCategoryById(categoryId: string) {
    return await ImageCategory.findById(categoryId);
  }

  static async getImageCategoryBySlug(slug: string) {
    return await ImageCategory.findOne({ slug });
  }

  static async createImageCategory(categoryData: any) {
    const slug = SlugUtil.generate(categoryData.name);

    // Batch fetch all categories instead of two separate queries
    const allCategories = await ImageCategory.find().select('slug').lean();
    const allSlugs = allCategories.map((c: any) => c.slug);
    const finalSlug = allSlugs.includes(slug) ? SlugUtil.generateUnique(categoryData.name, allSlugs) : slug;
    categoryData.slug = finalSlug;

    const category: Partial<IImageCategory> = {
      category_id: categoryData.category_id || uuidv4(),
      name: categoryData.name,
      slug: categoryData.slug,
      description: categoryData.description,
      is_active: categoryData.is_active !== undefined ? categoryData.is_active : true,
      display_order: categoryData.display_order || 0,
    };

    return await ImageCategory.create(category);
  }

  static async updateImageCategory(categoryId: string, categoryData: any) {
    const updateData: Partial<IImageCategory> = {};

    if (categoryData.name !== undefined) {
      updateData.name = categoryData.name;
      const newSlug = SlugUtil.generate(categoryData.name);
      const existingSlug = await ImageCategory.findOne({ slug: newSlug, _id: { $ne: categoryId } });
      if (!existingSlug) {
        updateData.slug = newSlug;
      }
    }

    if (categoryData.description !== undefined) updateData.description = categoryData.description;
    if (categoryData.is_active !== undefined) updateData.is_active = categoryData.is_active;
    if (categoryData.display_order !== undefined) updateData.display_order = categoryData.display_order;

    const category = await ImageCategory.findByIdAndUpdate(
      categoryId,
      updateData,
      { returnDocument: 'after' }
    );

    if (!category) {
      throw new AppError('Image category not found', 404);
    }

    return category;
  }

  static async deleteImageCategory(categoryId: string) {
    const category = await ImageCategory.findByIdAndUpdate(
      categoryId,
      { is_deleted: true, deleted_at: new Date() },
      { returnDocument: 'after' }
    );

    if (!category) {
      throw new AppError('Image category not found', 404);
    }

    return category;
  }

  static async restoreImageCategory(categoryId: string) {
    const category = await ImageCategory.findByIdAndUpdate(
      categoryId,
      { is_deleted: false, deleted_at: null },
      { returnDocument: 'after' }
    );

    if (!category) {
      throw new AppError('Image category not found', 404);
    }

    return category;
  }

  static async toggleImageCategoryActive(categoryId: string, is_active: boolean) {
    const category = await ImageCategory.findByIdAndUpdate(
      categoryId,
      { is_active },
      { returnDocument: 'after' }
    );

    if (!category) {
      throw new AppError('Image category not found', 404);
    }

    return category;
  }

  static async reorderImageCategories(orders: Array<{ _id: string; display_order: number }>) {
    const bulkOperations = orders.map(order => ({
      updateOne: {
        filter: { _id: order._id },
        update: { display_order: order.display_order }
      }
    }));

    await ImageCategory.bulkWrite(bulkOperations);
  }
}
