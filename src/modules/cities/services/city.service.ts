import { v4 as uuidv4 } from "uuid";
import { City, ICity } from "../../../models/city.model";
import { AppError } from "../../../shared/utils/app-error.util";
import { FilterUtil } from "../../../shared/utils/filter.util";
import { PaginationUtil } from "../../../shared/utils/pagination.util";
import { SlugUtil } from "../../../shared/utils/slug.util";

export class CityService {
  static async getAllCities(filterDto: any, includeDeleted: boolean = false) {
    const { page = 1, limit = 10, q, state, is_published, is_featured, sortBy = 'name', sortOrder = 'asc' } = filterDto;

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
    return await City.findOne({ city_id: cityId, is_deleted: false });
  }

  static async getCityBySlug(slug: string) {
    return await City.findOne({ slug, is_deleted: false });
  }

  static async createCity(cityData: any) {
    const city_id = uuidv4();
    const slug = SlugUtil.generate(`${cityData.name}-${cityData.state}`);

    const existingSlug = await City.findOne({ slug, is_deleted: false });
    if (existingSlug) {
      const existingSlugs = (await City.find({ is_deleted: false }).select('slug')).map(c => c.slug);
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
      city_logo: cityData.city_logo,
      is_published: cityData.is_published || false,
      is_featured: cityData.is_featured || false,
      is_deleted: false,
      meta_title: cityData.meta_title,
      meta_description: cityData.meta_description,
      meta_keywords: cityData.meta_keywords,
      og_image: cityData.og_image,
      canonical_url: cityData.canonical_url,
      noindex: cityData.noindex,
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
      const existingSlug = await City.findOne({ slug: cityData.slug, city_id: { $ne: cityId }, is_deleted: false });
      if (!existingSlug) {
        updateData.slug = cityData.slug;
      }
    } else if (cityData.name !== undefined || cityData.state !== undefined) {
      const name = cityData.name || (await City.findOne({ city_id: cityId, is_deleted: false }))?.name;
      const state = cityData.state || (await City.findOne({ city_id: cityId, is_deleted: false }))?.state;
      if (name && state) {
        const newSlug = SlugUtil.generate(`${name}-${state}`);
        const existingSlug = await City.findOne({ slug: newSlug, city_id: { $ne: cityId }, is_deleted: false });
        if (!existingSlug) {
          updateData.slug = newSlug;
        }
      }
    }

    if (cityData.pincode !== undefined) updateData.pincode = cityData.pincode;
    if (cityData.longitude !== undefined) updateData.longitude = cityData.longitude;
    if (cityData.latitude !== undefined) updateData.latitude = cityData.latitude;
    if (cityData.city_logo !== undefined) updateData.city_logo = cityData.city_logo;
    if (cityData.is_published !== undefined) updateData.is_published = cityData.is_published;
    if (cityData.is_featured !== undefined) updateData.is_featured = cityData.is_featured;
    if (cityData.meta_title !== undefined) updateData.meta_title = cityData.meta_title;
    if (cityData.meta_description !== undefined) updateData.meta_description = cityData.meta_description;
    if (cityData.meta_keywords !== undefined) updateData.meta_keywords = cityData.meta_keywords;
    if (cityData.og_image !== undefined) updateData.og_image = cityData.og_image;
    if (cityData.canonical_url !== undefined) updateData.canonical_url = cityData.canonical_url;
    if (cityData.noindex !== undefined) updateData.noindex = cityData.noindex;

    const city = await City.findOneAndUpdate(
      { city_id: cityId, is_deleted: false },
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
      { is_deleted: true },
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
      { is_deleted: false },
      { returnDocument: 'after' }
    );

    if (!city) {
      throw new AppError('City not found', 404);
    }

    return city;
  }

  static async togglePublish(cityId: string) {
    const city = await City.findOne({ city_id: cityId, is_deleted: false });
    if (!city) {
      throw new AppError('City not found', 404);
    }

    city.is_published = !city.is_published;
    await city.save();

    return city;
  }
}
