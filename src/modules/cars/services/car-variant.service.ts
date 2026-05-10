import { v4 as uuidv4 } from "uuid";
import { ERROR_CODES, USER_MESSAGES } from "../../../constants/errorMessages";
import { CarVariant, ICarVariant, SpecsNormalized } from "../../../models/car-variant.model";
import { Car } from "../../../models/car.model";
import { FuelType } from "../../../models/fuel-type.model";
import { AppError } from "../../../shared/utils/app-error.util";
import { FilterUtil } from "../../../shared/utils/filter.util";
import { PaginationUtil } from "../../../shared/utils/pagination.util";
import { SlugUtil } from "../../../shared/utils/slug.util";

export class CarVariantService {
  private static SECTION_NAME_TO_KEY_MAP: Record<string, keyof SpecsNormalized> = {
    'Engine & Performance': 'engine_performance',
    'Mileage / Range': 'mileage_range',
    'Battery & Charging': 'battery_charging',
    'Dimensions & Practicality': 'dimensions_practicality',
    'Suspension / Steering / Brakes': 'suspension_steering_brakes',
    'Tyres & Wheels': 'tyres_wheels',
    'Safety': 'safety',
    'ADAS': 'adas',
    'Comfort & Convenience': 'comfort_convenience',
    'Infotainment & Connectivity': 'infotainment_connectivity',
    'Connected Car': 'connected_car',
    'Interior': 'interior',
    'Exterior': 'exterior',
    'Warranty': 'warranty',
  };

  static removeHiddenSpecKeys(specs_normalized: SpecsNormalized | undefined, hidden_spec_keys: string[] = []): SpecsNormalized | undefined {
    if (!specs_normalized || !hidden_spec_keys || hidden_spec_keys.length === 0) {
      return specs_normalized;
    }

    const result = JSON.parse(JSON.stringify(specs_normalized)) as SpecsNormalized;

    hidden_spec_keys.forEach(keyPath => {
      const keys = keyPath.split('.');
      let current: any = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (current && current[keys[i]] !== undefined) {
          current = current[keys[i]];
        } else {
          return;
        }
      }
      
      if (current && current[keys[keys.length - 1]] !== undefined) {
        delete current[keys[keys.length - 1]];
      }
    });

    return result;
  }

  static removeHiddenSections(specs_normalized: SpecsNormalized | undefined, hidden_sections: string[] | undefined): SpecsNormalized | undefined {
    const sectionsToHide = hidden_sections || [];
    
    if (!specs_normalized || sectionsToHide.length === 0) {
      return specs_normalized;
    }

    // Create shallow copy only if needed (more efficient than deep clone)
    const result = { ...specs_normalized };

    // Delete only the sections that need to be hidden
    for (const sectionName of sectionsToHide) {
      const key = this.SECTION_NAME_TO_KEY_MAP[sectionName];
      if (key && result[key]) {
        delete result[key];
      } else if (!key) {
        console.warn(`Unknown section name in hidden_sections: ${sectionName}`);
      }
    }

    return result;
  }
  static async getAllVariants(filterDto: any, includeDeleted: boolean = false) {
    const {
      page = 1,
      limit = 10,
      q,
      car_id,
      fuel_type_id,
      transmission_type,
      model_year,
      is_published,
      is_archived,
      min_price,
      max_price,
      min_model_year,
      max_model_year,
      sortBy = 'variant_name',
      sortOrder = 'asc',
    } = filterDto;

    const filter: Record<string, unknown> = {};

    if (!includeDeleted) {
      filter.is_deleted = false;
    }

    // By default, exclude archived variants unless explicitly requested
    if (is_archived === undefined || is_archived === 'false') {
      filter.is_archived = false;
    } else if (is_archived === 'true') {
      filter.is_archived = true;
    }
    // If is_archived === 'all', don't add any filter for is_archived

    if (is_published !== undefined) {
      filter.is_published = is_published;
    }

    if (car_id !== undefined) {
      filter.car_id = car_id;
    }

    if (fuel_type_id !== undefined) {
      filter.fuel_type_id = fuel_type_id;
    }

    if (transmission_type !== undefined) {
      filter.transmission_type = transmission_type;
    }

    // Model year range filter
    if (model_year !== undefined) {
      filter.model_year = model_year;
    } else {
      if (min_model_year !== undefined || max_model_year !== undefined) {
        const yearFilter: Record<string, unknown> = {};
        if (min_model_year !== undefined) {
          yearFilter.$gte = Number(min_model_year);
        }
        if (max_model_year !== undefined) {
          yearFilter.$lte = Number(max_model_year);
        }
        filter.model_year = yearFilter;
      }
    }

    // Price range filter
    const priceFilter: Record<string, unknown> = {};
    if (min_price !== undefined) {
      priceFilter.$gte = Number(min_price);
    }
    if (max_price !== undefined) {
      priceFilter.$lte = Number(max_price);
    }

    if (Object.keys(priceFilter).length > 0) {
      filter.$or = [
        { ex_showroom_price: priceFilter },
        { expected_price: priceFilter },
      ];
    }

    if (q) {
      const searchFilter = FilterUtil.buildSearchFilter(['variant_name'], q);
      Object.assign(filter, searchFilter);
    }

    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);
    const sortFilter = FilterUtil.buildSortFilter(sortBy, sortOrder);

    const variants = await CarVariant.find(filter)
      .select('variant_id car_id variant_name slug model_year fuel_type_id transmission_type drivetrain seating_capacity ex_showroom_price expected_price is_published is_archived')
      .populate("car_id", "name slug")
      .populate("fuel_type_id", "name slug")
      .sort(sortFilter)
      .skip(skip)
      .limit(validatedLimit)
      .lean();

    const total = await CarVariant.countDocuments(filter);
    const paginationMeta = PaginationUtil.createPaginationMeta(page, validatedLimit, total);

    return { variants, pagination: paginationMeta };
  }

  static async getVariantById(variantId: string) {
    return await CarVariant.findOne({ variant_id: variantId, is_deleted: false })
      .populate("car_id", "name slug")
      .populate("fuel_type_id", "name slug");
  }

  static async getVariantBySlug(slug: string) {
    return await CarVariant.findOne({ slug, is_deleted: false })
      .populate("car_id", "name slug")
      .populate("fuel_type_id", "name slug");
  }

  static async createVariant(variantData: any) {
    const car = await Car.findOne({ car_id: variantData.car_id, is_deleted: false }).lean();
    if (!car) {
      throw new AppError(
        `Car not found or deleted for car_id: ${variantData.car_id}`,
        404,
        {
          userMessage: USER_MESSAGES.CAR_NOT_FOUND,
          errorCode: ERROR_CODES.CAR_NOT_FOUND,
          details: {
            field: 'car_id',
            reason: 'The car does not exist, is deleted, or the wrong ID type was sent.',
          },
        }
      );
    }

    // fuel_type_id is now optional - only validate if provided
    if (variantData.fuel_type_id) {
      const fuelType = await FuelType.findOne({ fuel_type_id: variantData.fuel_type_id, is_deleted: false }).lean();
      if (!fuelType) {
        throw new AppError(
          `Fuel type not found or deleted for fuel_type_id: ${variantData.fuel_type_id}`,
          404,
          {
            userMessage: USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
            errorCode: ERROR_CODES.FUEL_TYPE_NOT_FOUND,
            details: {
              field: 'fuel_type_id',
              reason: 'The fuel type does not exist, is deleted, or the wrong ID type was sent.',
            },
          }
        );
      }
    }

    const variant_id = uuidv4();
    const slug = SlugUtil.generate(variantData.variant_name);

    const existingSlug = await CarVariant.findOne({ slug, is_deleted: false });
    if (existingSlug) {
      const existingSlugs = (await CarVariant.find({ is_deleted: false }).select('slug')).map(v => v.slug);
      const uniqueSlug = SlugUtil.generateUnique(variantData.variant_name, existingSlugs);
      variantData.slug = uniqueSlug;
    } else {
      variantData.slug = slug;
    }

    const variant: Partial<ICarVariant> = {
      variant_id,
      car_id: variantData.car_id,
      variant_name: variantData.variant_name,
      slug: variantData.slug,
      model_year: variantData.model_year,
      fuel_type_id: variantData.fuel_type_id,
      transmission_type: variantData.transmission_type,
      drivetrain: variantData.drivetrain,
      seating_capacity: variantData.seating_capacity,
      ex_showroom_price: variantData.ex_showroom_price,
      expected_price: variantData.expected_price,
      expected_launch_date: variantData.expected_launch_date,
      specs_normalized: variantData.specs_normalized,
      hidden_spec_keys: variantData.hidden_spec_keys || [],
      hidden_sections: variantData.hidden_sections || [],
      is_published: variantData.is_published || false,
      is_deleted: false,
      is_archived: false,
    };

    return await CarVariant.create(variant);
  }

  static async updateVariant(variantId: string, variantData: any) {
    const updateData: Partial<ICarVariant> = {};

    if (variantData.variant_name !== undefined) {
      updateData.variant_name = variantData.variant_name;
      const newSlug = SlugUtil.generate(variantData.variant_name);
      const existingSlug = await CarVariant.findOne({ slug: newSlug, variant_id: { $ne: variantId }, is_deleted: false });
      if (!existingSlug) {
        updateData.slug = newSlug;
      }
    }

    if (variantData.car_id !== undefined) {
      const car = await Car.findOne({ car_id: variantData.car_id, is_deleted: false }).lean();
      if (!car) {
        throw new AppError(
          `Car not found or deleted for car_id: ${variantData.car_id}`,
          404,
          {
            userMessage: USER_MESSAGES.CAR_NOT_FOUND,
            errorCode: ERROR_CODES.CAR_NOT_FOUND,
            details: {
              field: 'car_id',
              reason: 'The car does not exist, is deleted, or the wrong ID type was sent.',
            },
          }
        );
      }
      updateData.car_id = variantData.car_id;
    }
    if (variantData.model_year !== undefined) updateData.model_year = variantData.model_year;
    if (variantData.fuel_type_id !== undefined) {
      // fuel_type_id is now optional - only validate if provided and not empty
      if (variantData.fuel_type_id) {
        const fuelType = await FuelType.findOne({ fuel_type_id: variantData.fuel_type_id, is_deleted: false }).lean();
        if (!fuelType) {
          throw new AppError(
            `Fuel type not found or deleted for fuel_type_id: ${variantData.fuel_type_id}`,
            404,
            {
              userMessage: USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
              errorCode: ERROR_CODES.FUEL_TYPE_NOT_FOUND,
              details: {
                field: 'fuel_type_id',
                reason: 'The fuel type does not exist, is deleted, or the wrong ID type was sent.',
              },
            }
          );
        }
      }
      updateData.fuel_type_id = variantData.fuel_type_id;
    }
    if (variantData.transmission_type !== undefined) updateData.transmission_type = variantData.transmission_type;
    if (variantData.drivetrain !== undefined) updateData.drivetrain = variantData.drivetrain;
    if (variantData.seating_capacity !== undefined) updateData.seating_capacity = variantData.seating_capacity;
    if (variantData.ex_showroom_price !== undefined) updateData.ex_showroom_price = variantData.ex_showroom_price;
    if (variantData.expected_price !== undefined) updateData.expected_price = variantData.expected_price;
    if (variantData.expected_launch_date !== undefined) updateData.expected_launch_date = variantData.expected_launch_date;
    if (variantData.specs_normalized !== undefined) updateData.specs_normalized = variantData.specs_normalized;
    if (variantData.hidden_spec_keys !== undefined) updateData.hidden_spec_keys = variantData.hidden_spec_keys;
    if (variantData.hidden_sections !== undefined) updateData.hidden_sections = variantData.hidden_sections;
    if (variantData.is_published !== undefined) updateData.is_published = variantData.is_published;

    const variant = await CarVariant.findOneAndUpdate(
      { variant_id: variantId, is_deleted: false },
      updateData,
      { returnDocument: 'after' }
    );

    if (!variant) {
      throw new AppError(
        `Variant not found or deleted for variant_id: ${variantId}`,
        404,
        {
          userMessage: USER_MESSAGES.VARIANT_NOT_FOUND,
          errorCode: ERROR_CODES.VARIANT_NOT_FOUND,
          details: {
            field: 'variant_id',
            reason: 'The variant does not exist or has been deleted.',
          },
        }
      );
    }

    return variant;
  }

  static async deleteVariant(variantId: string) {
    const variant = await CarVariant.findOneAndUpdate(
      { variant_id: variantId, is_deleted: false },
      { is_deleted: true },
      { returnDocument: 'after' }
    );

    if (!variant) {
      throw new AppError(
        `Variant not found or deleted for variant_id: ${variantId}`,
        404,
        {
          userMessage: USER_MESSAGES.VARIANT_NOT_FOUND,
          errorCode: ERROR_CODES.VARIANT_NOT_FOUND,
          details: {
            field: 'variant_id',
            reason: 'The variant does not exist or has already been deleted.',
          },
        }
      );
    }

    return variant;
  }

  static async restoreVariant(variantId: string) {
    const variant = await CarVariant.findOneAndUpdate(
      { variant_id: variantId, is_deleted: true },
      { is_deleted: false },
      { returnDocument: 'after' }
    );

    if (!variant) {
      throw new AppError(
        `Variant not found for variant_id: ${variantId}`,
        404,
        {
          userMessage: USER_MESSAGES.VARIANT_NOT_FOUND,
          errorCode: ERROR_CODES.VARIANT_NOT_FOUND,
          details: {
            field: 'variant_id',
            reason: 'The variant does not exist in the deleted records.',
          },
        }
      );
    }

    return variant;
  }

  static async togglePublish(variantId: string) {
    const variant = await CarVariant.findOne({ variant_id: variantId, is_deleted: false });
    if (!variant) {
      throw new AppError(
        `Variant not found or deleted for variant_id: ${variantId}`,
        404,
        {
          userMessage: USER_MESSAGES.VARIANT_NOT_FOUND,
          errorCode: ERROR_CODES.VARIANT_NOT_FOUND,
          details: {
            field: 'variant_id',
            reason: 'The variant does not exist or has been deleted.',
          },
        }
      );
    }

    variant.is_published = !variant.is_published;
    await variant.save();

    return variant;
  }

  static async publishVariant(variantId: string) {
    const variant = await CarVariant.findOneAndUpdate(
      { variant_id: variantId, is_deleted: false },
      { is_published: true },
      { returnDocument: 'after' }
    );

    if (!variant) {
      throw new AppError(
        `Variant not found or deleted for variant_id: ${variantId}`,
        404,
        {
          userMessage: USER_MESSAGES.VARIANT_NOT_FOUND,
          errorCode: ERROR_CODES.VARIANT_NOT_FOUND,
          details: {
            field: 'variant_id',
            reason: 'The variant does not exist or has been deleted.',
          },
        }
      );
    }

    return variant;
  }

  static async unpublishVariant(variantId: string) {
    const variant = await CarVariant.findOneAndUpdate(
      { variant_id: variantId, is_deleted: false },
      { is_published: false },
      { returnDocument: 'after' }
    );

    if (!variant) {
      throw new AppError(
        `Variant not found or deleted for variant_id: ${variantId}`,
        404,
        {
          userMessage: USER_MESSAGES.VARIANT_NOT_FOUND,
          errorCode: ERROR_CODES.VARIANT_NOT_FOUND,
          details: {
            field: 'variant_id',
            reason: 'The variant does not exist or has been deleted.',
          },
        }
      );
    }

    return variant;
  }

  static async archiveVariant(variantId: string, archivedBy?: string) {
    const variant = await CarVariant.findOneAndUpdate(
      { variant_id: variantId, is_deleted: false, is_archived: false },
      { 
        is_archived: true, 
        archived_at: new Date(),
        archived_by: archivedBy
      },
      { returnDocument: 'after' }
    );

    if (!variant) {
      throw new AppError(
        `Variant not found, deleted, or already archived for variant_id: ${variantId}`,
        404,
        {
          userMessage: USER_MESSAGES.VARIANT_NOT_FOUND,
          errorCode: ERROR_CODES.VARIANT_NOT_FOUND,
          details: {
            field: 'variant_id',
            reason: 'The variant does not exist, is deleted, or is already archived.',
          },
        }
      );
    }

    return variant;
  }

  static async unarchiveVariant(variantId: string) {
    const variant = await CarVariant.findOneAndUpdate(
      { variant_id: variantId, is_deleted: false, is_archived: true },
      { 
        is_archived: false,
        archived_at: null,
        archived_by: null
      },
      { returnDocument: 'after' }
    );

    if (!variant) {
      throw new AppError(
        `Variant not found, deleted, or not archived for variant_id: ${variantId}`,
        404,
        {
          userMessage: USER_MESSAGES.VARIANT_NOT_FOUND,
          errorCode: ERROR_CODES.VARIANT_NOT_FOUND,
          details: {
            field: 'variant_id',
            reason: 'The variant does not exist, is deleted, or is not archived.',
          },
        }
      );
    }

    return variant;
  }
}
