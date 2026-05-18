import { v4 as uuidv4 } from "uuid";
import { City, ICity } from "../../../models/city.model";
import { AppError } from "../../../shared/utils/app-error.util";
import { FilterUtil } from "../../../shared/utils/filter.util";
import { PaginationUtil } from "../../../shared/utils/pagination.util";
import { SlugUtil } from "../../../shared/utils/slug.util";

export class CityService {
  static async getAllCities(filterDto: any, includeDeleted: boolean = false) {
    const { page = 1, limit = 10, q, state, is_deleted, sortBy = 'name', sortOrder = 'asc' } = filterDto;

    const filter: Record<string, unknown> = {};

    if (is_deleted === 'true' || is_deleted === true) {
      filter.is_deleted = true;
    } else if (!includeDeleted) {
      filter.is_deleted = false;
    }

    if (state !== undefined) {
      filter.state = state;
    }

    if (q) {
      const searchFilter = FilterUtil.buildSearchFilter(['name', 'state'], q);
      Object.assign(filter, searchFilter);
    }

    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);
    const sortFilter = FilterUtil.buildSortFilter(sortBy, sortOrder);

    const cities = await City.find(filter)
      .sort(sortFilter)
      .skip(skip)
      .limit(validatedLimit);

    const total = await City.countDocuments(filter);
    const paginationMeta = PaginationUtil.createPaginationMeta(page, validatedLimit, total);

    return { cities, pagination: paginationMeta };
  }

  static async getCityById(cityId: string) {
    return await City.findOne({ city_id: cityId });
  }

  static async getCityBySlug(slug: string) {
    return await City.findOne({ slug });
  }

  static async createCity(cityData: any) {
    const city_id = uuidv4();
    const slug = SlugUtil.generate(`${cityData.name}-${cityData.state}`);

    const existingSlug = await City.findOne({ slug });
    if (existingSlug) {
      const existingSlugs = (await City.find().select('slug')).map(c => c.slug);
      const uniqueSlug = SlugUtil.generateUnique(`${cityData.name}-${cityData.state}`, existingSlugs);
      cityData.slug = uniqueSlug;
    } else {
      cityData.slug = slug;
    }

    const city: Partial<ICity> = {
      city_id,
      name: cityData.name,
      slug: cityData.slug,
      state: cityData.state,
      country: cityData.country,
      pincode: cityData.pincode,
      longitude: cityData.longitude,
      latitude: cityData.latitude,
    };

    return await City.create(city);
  }

  static async updateCity(cityId: string, cityData: any) {
    const updateData: Partial<ICity> = {};

    if (cityData.name !== undefined) {
      updateData.name = cityData.name;
    }

    if (cityData.state !== undefined) {
      updateData.state = cityData.state;
    }

    if (cityData.country !== undefined) {
      updateData.country = cityData.country;
    }

    if (cityData.slug !== undefined) {
      const existingSlug = await City.findOne({ slug: cityData.slug, city_id: { $ne: cityId } });
      if (!existingSlug) {
        updateData.slug = cityData.slug;
      }
    } else if (cityData.name !== undefined || cityData.state !== undefined) {
      const currentCity = await City.findOne({ city_id: cityId });
      const name = cityData.name || currentCity?.name;
      const state = cityData.state || currentCity?.state;
      if (name && state) {
        const newSlug = SlugUtil.generate(`${name}-${state}`);
        const existingSlug = await City.findOne({ slug: newSlug, city_id: { $ne: cityId } });
        if (!existingSlug) {
          updateData.slug = newSlug;
        }
      }
    }

    if (cityData.pincode !== undefined) updateData.pincode = cityData.pincode;
    if (cityData.longitude !== undefined) updateData.longitude = cityData.longitude;
    if (cityData.latitude !== undefined) updateData.latitude = cityData.latitude;

    const city = await City.findOneAndUpdate(
      { city_id: cityId },
      updateData,
      { returnDocument: 'after' }
    );

    if (!city) {
      throw new AppError('City not found', 404);
    }

    return city;
  }

  static async deleteCity(cityId: string) {
    const city = await City.findOneAndUpdate(
      { city_id: cityId, is_deleted: false },
      { is_deleted: true, deleted_at: new Date() },
      { returnDocument: 'after' }
    );

    if (!city) {
      throw new AppError('City not found', 404);
    }

    return city;
  }

  static async restoreCity(cityId: string) {
    const city = await City.findOneAndUpdate(
      { city_id: cityId, is_deleted: true },
      { is_deleted: false, deleted_at: null },
      { returnDocument: 'after' }
    );

    if (!city) {
      throw new AppError('City not found or not deleted', 404);
    }

    return city;
  }
}
