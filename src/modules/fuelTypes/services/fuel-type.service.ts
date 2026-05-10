import { v4 as uuidv4 } from "uuid";
import { ERROR_CODES, USER_MESSAGES } from "../../../constants/errorMessages";
import { FuelType, IFuelType } from "../../../models/fuel-type.model";
import { AppError } from "../../../shared/utils/app-error.util";
import { FilterUtil } from "../../../shared/utils/filter.util";
import { PaginationUtil } from "../../../shared/utils/pagination.util";
import { SlugUtil } from "../../../shared/utils/slug.util";

export class FuelTypeService {
  static async getAllFuelTypes(filterDto: any, includeDeleted: boolean = false) {
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

    const fuelTypes = await FuelType.find(filter)
      .sort(sortFilter)
      .skip(skip)
      .limit(validatedLimit);

    const total = await FuelType.countDocuments(filter);
    const paginationMeta = PaginationUtil.createPaginationMeta(page, validatedLimit, total);

    return { fuelTypes, pagination: paginationMeta };
  }

  static async getFuelTypeById(fuelTypeId: string) {
    return await FuelType.findOne({ fuel_type_id: fuelTypeId, is_deleted: false } as any);
  }

  static async getFuelTypeBySlug(slug: string) {
    return await FuelType.findOne({ slug, is_deleted: false });
  }

  static async createFuelType(fuelTypeData: any) {
    const fuel_type_id = uuidv4();
    const slug = SlugUtil.generate(fuelTypeData.name);

    const existingSlug = await FuelType.findOne({ slug, is_deleted: false });
    if (existingSlug) {
      const existingSlugs = (await FuelType.find({ is_deleted: false }).select('slug')).map(f => f.slug);
      const uniqueSlug = SlugUtil.generateUnique(fuelTypeData.name, existingSlugs);
      fuelTypeData.slug = uniqueSlug;
    } else {
      fuelTypeData.slug = slug;
    }

    const fuelType: Partial<IFuelType> = {
      fuel_type_id,
      name: fuelTypeData.name,
      slug: fuelTypeData.slug,
      description: fuelTypeData.description,
      is_published: fuelTypeData.is_published || false,
      is_featured: fuelTypeData.is_featured || false,
      is_deleted: false,
    };

    return await FuelType.create(fuelType);
  }

  static async updateFuelType(fuelTypeId: string, fuelTypeData: any) {
    const updateData: Partial<IFuelType> = {};

    if (fuelTypeData.name !== undefined) {
      updateData.name = fuelTypeData.name;
      const newSlug = SlugUtil.generate(fuelTypeData.name);
      const existingSlug = await FuelType.findOne({ slug: newSlug, fuel_type_id: { $ne: fuelTypeId }, is_deleted: false });
      if (!existingSlug) {
        updateData.slug = newSlug;
      }
    }

    if (fuelTypeData.description !== undefined) updateData.description = fuelTypeData.description;
    if (fuelTypeData.is_published !== undefined) updateData.is_published = fuelTypeData.is_published;
    if (fuelTypeData.is_featured !== undefined) updateData.is_featured = fuelTypeData.is_featured;

    const fuelType = await FuelType.findOneAndUpdate(
      { fuel_type_id: fuelTypeId, is_deleted: false },
      updateData,
      { returnDocument: 'after' }
    );

    if (!fuelType) {
      throw new AppError(
        `Fuel type not found or deleted for fuel_type_id: ${fuelTypeId}`,
        404,
        {
          userMessage: USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
          errorCode: ERROR_CODES.FUEL_TYPE_NOT_FOUND,
          details: {
            field: 'fuel_type_id',
            reason: 'The fuel type does not exist or has been deleted.',
          },
        }
      );
    }

    return fuelType;
  }

  static async deleteFuelType(fuelTypeId: string) {
    const fuelType = await FuelType.findOneAndUpdate(
      { fuel_type_id: fuelTypeId, is_deleted: false },
      { is_deleted: true },
      { returnDocument: 'after' }
    );

    if (!fuelType) {
      throw new AppError(
        `Fuel type not found or deleted for fuel_type_id: ${fuelTypeId}`,
        404,
        {
          userMessage: USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
          errorCode: ERROR_CODES.FUEL_TYPE_NOT_FOUND,
          details: {
            field: 'fuel_type_id',
            reason: 'The fuel type does not exist or has already been deleted.',
          },
        }
      );
    }

    return fuelType;
  }

  static async restoreFuelType(fuelTypeId: string) {
    const fuelType = await FuelType.findOneAndUpdate(
      { fuel_type_id: fuelTypeId, is_deleted: true },
      { is_deleted: false },
      { returnDocument: 'after' }
    );

    if (!fuelType) {
      throw new AppError(
        `Fuel type not found for fuel_type_id: ${fuelTypeId}`,
        404,
        {
          userMessage: USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
          errorCode: ERROR_CODES.FUEL_TYPE_NOT_FOUND,
          details: {
            field: 'fuel_type_id',
            reason: 'The fuel type does not exist in the deleted records.',
          },
        }
      );
    }

    return fuelType;
  }

  static async togglePublish(fuelTypeId: string) {
    const fuelType = await FuelType.findOne({ fuel_type_id: fuelTypeId, is_deleted: false });
    if (!fuelType) {
      throw new AppError(
        `Fuel type not found or deleted for fuel_type_id: ${fuelTypeId}`,
        404,
        {
          userMessage: USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
          errorCode: ERROR_CODES.FUEL_TYPE_NOT_FOUND,
          details: {
            field: 'fuel_type_id',
            reason: 'The fuel type does not exist or has been deleted.',
          },
        }
      );
    }

    fuelType.is_published = !fuelType.is_published;
    await fuelType.save();

    return fuelType;
  }
}
