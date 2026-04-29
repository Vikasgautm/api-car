import { IImageCategory, ImageCategory } from "../../../models/image-category.model";
import { AppError } from "../../../shared/utils/app-error.util";
import { FilterUtil } from "../../../shared/utils/filter.util";
import { PaginationUtil } from "../../../shared/utils/pagination.util";
import { SlugUtil } from "../../../shared/utils/slug.util";

export class ImageCategoryService {
  static async getAllImageCategories(filterDto: any) {
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

    if (is_active !== undefined) filter.is_active = is_active === 'true';
    if (is_deleted !== undefined) filter.is_deleted = is_deleted === 'true';
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);
    const sortFilter = FilterUtil.buildSortFilter(sortBy, sortOrder);

    const categories = await ImageCategory.find(filter)
      .select('name slug description is_active display_order')
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

    const existingSlug = await ImageCategory.findOne({ slug });
    if (existingSlug) {
      const existingSlugs = (await ImageCategory.find().select('slug')).map(c => c.slug);
      const uniqueSlug = SlugUtil.generateUnique(categoryData.name, existingSlugs);
      categoryData.slug = uniqueSlug;
    } else {
      categoryData.slug = slug;
    }

    const category: Partial<IImageCategory> = {
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
    const category = await ImageCategory.findByIdAndDelete(
      categoryId
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
