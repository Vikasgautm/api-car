import { v4 as uuidv4 } from "uuid";
import { BodyType, IBodyType } from "../../../models/body-type.model";
import { AppError } from "../../../shared/utils/app-error.util";
import { FilterUtil } from "../../../shared/utils/filter.util";
import { PaginationUtil } from "../../../shared/utils/pagination.util";
import { SlugUtil } from "../../../shared/utils/slug.util";

export class BodyTypeService {
  static async getAllBodyTypes(filterDto: any, includeDeleted: boolean = false) {
    const { page = 1, limit = 10, q, is_published, is_featured, sortBy = 'name', sortOrder = 'asc' } = filterDto;

    const filter: Record<string, unknown> = {};

    if (!includeDeleted) {
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

    const bodyTypes = await BodyType.find(filter)
      .sort(sortFilter)
      .skip(skip)
      .limit(validatedLimit);

    const total = await BodyType.countDocuments(filter);
    const paginationMeta = PaginationUtil.createPaginationMeta(page, validatedLimit, total);

    return { bodyTypes, pagination: paginationMeta };
  }

  static async getBodyTypeById(bodyTypeId: string) {
    return await BodyType.findOne({ body_type_id: bodyTypeId, is_deleted: false } as any);
  }

  static async getBodyTypeBySlug(slug: string) {
    return await BodyType.findOne({ slug, is_deleted: false });
  }

  static async createBodyType(bodyTypeData: any) {
    const body_type_id = uuidv4();
    const slug = SlugUtil.generate(bodyTypeData.name);

    const existingSlug = await BodyType.findOne({ slug, is_deleted: false });
    if (existingSlug) {
      const existingSlugs = (await BodyType.find({ is_deleted: false }).select('slug')).map(b => b.slug);
      const uniqueSlug = SlugUtil.generateUnique(bodyTypeData.name, existingSlugs);
      bodyTypeData.slug = uniqueSlug;
    } else {
      bodyTypeData.slug = slug;
    }

    const bodyType: Partial<IBodyType> = {
      body_type_id,
      name: bodyTypeData.name,
      slug: bodyTypeData.slug,
      description: bodyTypeData.description,
      is_published: bodyTypeData.is_published || false,
      is_featured: bodyTypeData.is_featured || false,
      is_deleted: false,
    };

    if (bodyTypeData.logo_url) {
      bodyType.logo = {
        url: bodyTypeData.logo_url,
        title: bodyTypeData.logo_title || bodyTypeData.name,
      };
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
    if (bodyTypeData.is_published !== undefined) updateData.is_published = bodyTypeData.is_published;
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

    const bodyType = await BodyType.findOneAndUpdate(
      { body_type_id: bodyTypeId, is_deleted: false } as any,
      updateData,
      { returnDocument: 'after' }
    );

    if (!bodyType) {
      throw new AppError('Body type not found', 404);
    }

    return bodyType;
  }

  static async deleteBodyType(bodyTypeId: string) {
    // First check if body type exists at all
    const existingBodyType = await BodyType.findOne({ body_type_id: bodyTypeId });
    
    if (!existingBodyType) {
      throw new AppError('Body type not found', 404);
    }
    
    // If already deleted, return success (idempotent)
    if (existingBodyType.is_deleted) {
      return existingBodyType;
    }
    
    // Otherwise, soft delete it
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
      throw new AppError('Body type not found', 404);
    }

    return bodyType;
  }

  static async togglePublish(bodyTypeId: string) {
    const bodyType = await BodyType.findOne({ body_type_id: bodyTypeId, is_deleted: false });
    if (!bodyType) {
      throw new AppError('Body type not found', 404);
    }

    bodyType.is_published = !bodyType.is_published;
    await bodyType.save();

    return bodyType;
  }
}
