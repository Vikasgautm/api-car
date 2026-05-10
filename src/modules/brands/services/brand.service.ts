import { v4 as uuidv4 } from "uuid";
import { ERROR_CODES, USER_MESSAGES } from "../../../constants/errorMessages";
import { Brand, IBrand } from "../../../models/brand.model";
import { AppError } from "../../../shared/utils/app-error.util";
import { FilterUtil } from "../../../shared/utils/filter.util";
import { PaginationUtil } from "../../../shared/utils/pagination.util";
import { SlugUtil } from "../../../shared/utils/slug.util";

export class BrandService {
  static async getAllBrands(filterDto: any, includeDeleted: boolean = false) {
    const { page = 1, limit = 10, q, is_published, is_featured, is_deleted, sortBy = 'name', sortOrder = 'asc' } = filterDto;

    const filter: Record<string, unknown> = {};

    if (is_deleted === 'true' || is_deleted === true) {
      filter.is_deleted = true;
    } else if (!includeDeleted) {
      filter.is_deleted = false;
    }

    if (is_published !== undefined) {
      filter.is_published = is_published;
    }

    if (is_featured !== undefined) {
      filter.is_featured = is_featured;
    }

    if (q) {
      const searchFilter = FilterUtil.buildSearchFilter(['name', 'description'], q);
      Object.assign(filter, searchFilter);
    }

    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);
    const sortFilter = FilterUtil.buildSortFilter(sortBy, sortOrder);

    const brands = await Brand.find(filter)
      .sort(sortFilter)
      .skip(skip)
      .limit(validatedLimit);

    const total = await Brand.countDocuments(filter);
    const paginationMeta = PaginationUtil.createPaginationMeta(page, validatedLimit, total);

    return { brands, pagination: paginationMeta };
  }

  static async getBrandById(brandId: string) {
    return await Brand.findOne({ brand_id: brandId, is_deleted: false } as any);
  }

  static async getBrandBySlug(slug: string) {
    return await Brand.findOne({ slug, is_deleted: false, is_published: true }).lean();
  }

  static async createBrand(brandData: any) {
    const brand_id = uuidv4();
    const slug = SlugUtil.generate(brandData.name);

    const existingSlug = await Brand.findOne({ slug, is_deleted: false });
    if (existingSlug) {
      const existingSlugs = (await Brand.find({ is_deleted: false }).select('slug')).map(b => b.slug);
      const uniqueSlug = SlugUtil.generateUnique(brandData.name, existingSlugs);
      brandData.slug = uniqueSlug;
    } else {
      brandData.slug = slug;
    }

    const brand: Partial<IBrand> = {
      brand_id,
      name: brandData.name,
      slug: brandData.slug,
      description: brandData.description,
      logo: brandData.logo_url ? {
        url: brandData.logo_url,
        title: brandData.logo_title,
      } : undefined,
      website: brandData.website,
      is_published: brandData.is_published || false,
      is_featured: brandData.is_featured || false,
      is_deleted: false,
      meta_title: brandData.meta_title,
      meta_description: brandData.meta_description,
      meta_keywords: brandData.meta_keywords,
      og_image: brandData.og_image,
      canonical_url: brandData.canonical_url,
      noindex: brandData.noindex,
    };

    return await Brand.create(brand);
  }

  static async updateBrand(brandId: string, brandData: any) {
    const updateData: Partial<IBrand> = {};

    if (brandData.name !== undefined) {
      updateData.name = brandData.name;
      const newSlug = SlugUtil.generate(brandData.name);
      const existingSlug = await Brand.findOne({ slug: newSlug, brand_id: { $ne: brandId }, is_deleted: false });
      if (!existingSlug) {
        updateData.slug = newSlug;
      }
    }

    if (brandData.description !== undefined) updateData.description = brandData.description;
    if (brandData.logo_url !== undefined) {
      updateData.logo = {
        url: brandData.logo_url,
        title: brandData.logo_title,
      };
    }
    if (brandData.website !== undefined) updateData.website = brandData.website;
    if (brandData.is_published !== undefined) updateData.is_published = brandData.is_published;
    if (brandData.is_featured !== undefined) updateData.is_featured = brandData.is_featured;
    if (brandData.meta_title !== undefined) updateData.meta_title = brandData.meta_title;
    if (brandData.meta_description !== undefined) updateData.meta_description = brandData.meta_description;
    if (brandData.meta_keywords !== undefined) updateData.meta_keywords = brandData.meta_keywords;
    if (brandData.og_image !== undefined) updateData.og_image = brandData.og_image;
    if (brandData.canonical_url !== undefined) updateData.canonical_url = brandData.canonical_url;
    if (brandData.noindex !== undefined) updateData.noindex = brandData.noindex;

    const brand = await Brand.findOneAndUpdate(
      { brand_id: brandId, is_deleted: false },
      updateData,
      { returnDocument: 'after' }
    );

    if (!brand) {
      throw new AppError(
        `Brand not found or deleted for brand_id: ${brandId}`,
        404,
        {
          userMessage: USER_MESSAGES.BRAND_NOT_FOUND,
          errorCode: ERROR_CODES.BRAND_NOT_FOUND,
          details: {
            field: 'brand_id',
            reason: 'The brand does not exist or has been deleted.',
          },
        }
      );
    }

    return brand;
  }

  static async deleteBrand(brandId: string) {
    const brand = await Brand.findOneAndUpdate(
      { brand_id: brandId, is_deleted: false },
      { is_deleted: true },
      { returnDocument: 'after' }
    );

    if (!brand) {
      throw new AppError(
        `Brand not found or deleted for brand_id: ${brandId}`,
        404,
        {
          userMessage: USER_MESSAGES.BRAND_NOT_FOUND,
          errorCode: ERROR_CODES.BRAND_NOT_FOUND,
          details: {
            field: 'brand_id',
            reason: 'The brand does not exist or has already been deleted.',
          },
        }
      );
    }

    return brand;
  }

  static async restoreBrand(brandId: string) {
    const brand = await Brand.findOneAndUpdate(
      { brand_id: brandId, is_deleted: true },
      { is_deleted: false },
      { returnDocument: 'after' }
    );

    if (!brand) {
      throw new AppError(
        `Brand not found for brand_id: ${brandId}`,
        404,
        {
          userMessage: USER_MESSAGES.BRAND_NOT_FOUND,
          errorCode: ERROR_CODES.BRAND_NOT_FOUND,
          details: {
            field: 'brand_id',
            reason: 'The brand does not exist in the deleted records.',
          },
        }
      );
    }

    return brand;
  }

  static async togglePublish(brandId: string) {
    const brand = await Brand.findOne({ brand_id: brandId, is_deleted: false });
    if (!brand) {
      throw new AppError(
        `Brand not found or deleted for brand_id: ${brandId}`,
        404,
        {
          userMessage: USER_MESSAGES.BRAND_NOT_FOUND,
          errorCode: ERROR_CODES.BRAND_NOT_FOUND,
          details: {
            field: 'brand_id',
            reason: 'The brand does not exist or has been deleted.',
          },
        }
      );
    }

    brand.is_published = !brand.is_published;
    await brand.save();

    return brand;
  }
}
