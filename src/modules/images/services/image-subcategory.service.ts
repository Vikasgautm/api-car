import { ImageCategory } from "../../../models/image-category.model";
import { IImageSubCategory, ImageSubCategory } from "../../../models/image-subcategory.model";
import { AppError } from "../../../shared/utils/app-error.util";
import { FilterUtil } from "../../../shared/utils/filter.util";
import { PaginationUtil } from "../../../shared/utils/pagination.util";
import { SlugUtil } from "../../../shared/utils/slug.util";

export class ImageSubCategoryService {
  static async getAllImageSubCategories(filterDto: any) {
    const {
      page = 1,
      limit = 10,
      category_id,
      is_active,
      is_deleted,
      q,
      sortBy = 'display_order',
      sortOrder = 'asc',
    } = filterDto;

    const filter: Record<string, unknown> = {};

    if (category_id) filter.category_id = category_id;
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

    const subcategories = await ImageSubCategory.find(filter)
      .populate('category_id', 'name slug')
      .select('category_id name slug description is_active display_order')
      .sort(sortFilter)
      .skip(skip)
      .limit(validatedLimit)
      .lean();

    const total = await ImageSubCategory.countDocuments(filter);
    const paginationMeta = PaginationUtil.createPaginationMeta(page, validatedLimit, total);

    return { subcategories, pagination: paginationMeta };
  }

  static async getImageSubCategoryById(subcategoryId: string) {
    return await ImageSubCategory.findById(subcategoryId).populate('category_id', 'name slug');
  }

  static async getImageSubCategoryBySlug(slug: string) {
    return await ImageSubCategory.findOne({ slug }).populate('category_id', 'name slug');
  }

  static async createImageSubCategory(subcategoryData: any) {
    // Validate category exists
    const category = await ImageCategory.findById(subcategoryData.category_id);
    if (!category) {
      throw new AppError('Image category not found', 404);
    }

    const slug = SlugUtil.generate(subcategoryData.name);

    const existingSlug = await ImageSubCategory.findOne({ slug });
    if (existingSlug) {
      const existingSlugs = (await ImageSubCategory.find().select('slug')).map(c => c.slug);
      const uniqueSlug = SlugUtil.generateUnique(subcategoryData.name, existingSlugs);
      subcategoryData.slug = uniqueSlug;
    } else {
      subcategoryData.slug = slug;
    }

    const subcategory: Partial<IImageSubCategory> = {
      category_id: subcategoryData.category_id,
      name: subcategoryData.name,
      slug: subcategoryData.slug,
      description: subcategoryData.description,
      is_active: subcategoryData.is_active !== undefined ? subcategoryData.is_active : true,
      display_order: subcategoryData.display_order || 0,
    };

    return await ImageSubCategory.create(subcategory);
  }

  static async updateImageSubCategory(subcategoryId: string, subcategoryData: any) {
    const updateData: Partial<IImageSubCategory> = {};

    if (subcategoryData.category_id !== undefined) {
      const category = await ImageCategory.findById(subcategoryData.category_id);
      if (!category) {
        throw new AppError('Image category not found', 404);
      }
      updateData.category_id = subcategoryData.category_id;
    }

    if (subcategoryData.name !== undefined) {
      updateData.name = subcategoryData.name;
      const newSlug = SlugUtil.generate(subcategoryData.name);
      const existingSlug = await ImageSubCategory.findOne({ slug: newSlug, _id: { $ne: subcategoryId } });
      if (!existingSlug) {
        updateData.slug = newSlug;
      }
    }

    if (subcategoryData.description !== undefined) updateData.description = subcategoryData.description;
    if (subcategoryData.is_active !== undefined) updateData.is_active = subcategoryData.is_active;
    if (subcategoryData.display_order !== undefined) updateData.display_order = subcategoryData.display_order;

    const subcategory = await ImageSubCategory.findByIdAndUpdate(
      subcategoryId,
      updateData,
      { returnDocument: 'after' }
    );

    if (!subcategory) {
      throw new AppError('Image subcategory not found', 404);
    }

    return subcategory;
  }

  static async deleteImageSubCategory(subcategoryId: string) {
    const subcategory = await ImageSubCategory.findByIdAndUpdate(
      subcategoryId,
      { is_deleted: true, deleted_at: new Date() },
      { returnDocument: 'after' }
    );

    if (!subcategory) {
      throw new AppError('Image subcategory not found', 404);
    }

    return subcategory;
  }

  static async restoreImageSubCategory(subcategoryId: string) {
    const subcategory = await ImageSubCategory.findByIdAndUpdate(
      subcategoryId,
      { is_deleted: false, deleted_at: null },
      { returnDocument: 'after' }
    );

    if (!subcategory) {
      throw new AppError('Image subcategory not found', 404);
    }

    return subcategory;
  }

  static async toggleImageSubCategoryActive(subcategoryId: string, is_active: boolean) {
    const subcategory = await ImageSubCategory.findByIdAndUpdate(
      subcategoryId,
      { is_active },
      { returnDocument: 'after' }
    );

    if (!subcategory) {
      throw new AppError('Image subcategory not found', 404);
    }

    return subcategory;
  }

  static async reorderImageSubCategories(orders: Array<{ _id: string; display_order: number }>) {
    const bulkOperations = orders.map(order => ({
      updateOne: {
        filter: { _id: order._id },
        update: { display_order: order.display_order }
      }
    }));

    await ImageSubCategory.bulkWrite(bulkOperations);
  }
}
