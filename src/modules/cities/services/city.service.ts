import { v4 as uuidv4 } from "uuid";
import { City, ICity } from "../../../models/city.model";
import { AppError } from "../../../shared/utils/app-error.util";
import { FilterUtil } from "../../../shared/utils/filter.util";
import { PaginationUtil } from "../../../shared/utils/pagination.util";
import { SlugUtil } from "../../../shared/utils/slug.util";

const ALL_INDIA_CITIES = [
  // Delhi
  { name: 'New Delhi', state: 'Delhi', pincode: 110001, latitude: 28.6139, longitude: 77.2090 },
  // Maharashtra
  { name: 'Mumbai', state: 'Maharashtra', pincode: 400001, latitude: 19.0760, longitude: 72.8777 },
  { name: 'Pune', state: 'Maharashtra', pincode: 411001, latitude: 18.5204, longitude: 73.8567 },
  { name: 'Nagpur', state: 'Maharashtra', pincode: 440001, latitude: 21.1458, longitude: 79.0882 },
  { name: 'Nashik', state: 'Maharashtra', pincode: 422001, latitude: 19.9975, longitude: 73.7898 },
  { name: 'Aurangabad', state: 'Maharashtra', pincode: 431001, latitude: 19.8762, longitude: 75.3433 },
  { name: 'Solapur', state: 'Maharashtra', pincode: 413001, latitude: 17.6868, longitude: 75.9064 },
  // Karnataka
  { name: 'Bangalore', state: 'Karnataka', pincode: 560001, latitude: 12.9716, longitude: 77.5946 },
  { name: 'Mysore', state: 'Karnataka', pincode: 570001, latitude: 12.2958, longitude: 76.6394 },
  { name: 'Hubli', state: 'Karnataka', pincode: 580020, latitude: 15.3647, longitude: 75.1240 },
  { name: 'Mangalore', state: 'Karnataka', pincode: 575001, latitude: 12.9141, longitude: 74.8560 },
  { name: 'Belgaum', state: 'Karnataka', pincode: 590001, latitude: 15.8497, longitude: 74.4977 },
  // Tamil Nadu
  { name: 'Chennai', state: 'Tamil Nadu', pincode: 600001, latitude: 13.0827, longitude: 80.2707 },
  { name: 'Coimbatore', state: 'Tamil Nadu', pincode: 641001, latitude: 11.0168, longitude: 76.9558 },
  { name: 'Madurai', state: 'Tamil Nadu', pincode: 625001, latitude: 9.9252, longitude: 78.1198 },
  { name: 'Trichy', state: 'Tamil Nadu', pincode: 620001, latitude: 10.7905, longitude: 78.7047 },
  { name: 'Salem', state: 'Tamil Nadu', pincode: 636001, latitude: 11.6643, longitude: 78.1460 },
  { name: 'Tirunelveli', state: 'Tamil Nadu', pincode: 627001, latitude: 8.7139, longitude: 77.7567 },
  { name: 'Vellore', state: 'Tamil Nadu', pincode: 632001, latitude: 12.9165, longitude: 79.1325 },
  // Telangana
  { name: 'Hyderabad', state: 'Telangana', pincode: 500001, latitude: 17.3850, longitude: 78.4867 },
  { name: 'Warangal', state: 'Telangana', pincode: 506001, latitude: 17.9784, longitude: 79.5941 },
  { name: 'Nizamabad', state: 'Telangana', pincode: 503001, latitude: 18.6725, longitude: 78.0941 },
  // Andhra Pradesh
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', pincode: 530001, latitude: 17.6868, longitude: 83.2185 },
  { name: 'Vijayawada', state: 'Andhra Pradesh', pincode: 520001, latitude: 16.5062, longitude: 80.6480 },
  { name: 'Guntur', state: 'Andhra Pradesh', pincode: 522001, latitude: 16.3067, longitude: 80.4365 },
  { name: 'Nellore', state: 'Andhra Pradesh', pincode: 524001, latitude: 14.4426, longitude: 79.9865 },
  { name: 'Kurnool', state: 'Andhra Pradesh', pincode: 518001, latitude: 15.8281, longitude: 78.0373 },
  // Gujarat
  { name: 'Ahmedabad', state: 'Gujarat', pincode: 380001, latitude: 23.0225, longitude: 72.5714 },
  { name: 'Surat', state: 'Gujarat', pincode: 395001, latitude: 21.1702, longitude: 72.8311 },
  { name: 'Vadodara', state: 'Gujarat', pincode: 390001, latitude: 22.3072, longitude: 73.1812 },
  { name: 'Rajkot', state: 'Gujarat', pincode: 360001, latitude: 22.3039, longitude: 70.8022 },
  { name: 'Bhavnagar', state: 'Gujarat', pincode: 364001, latitude: 21.7645, longitude: 72.1519 },
  { name: 'Jamnagar', state: 'Gujarat', pincode: 361001, latitude: 22.4707, longitude: 70.0577 },
  // Rajasthan
  { name: 'Jaipur', state: 'Rajasthan', pincode: 302001, latitude: 26.9124, longitude: 75.7873 },
  { name: 'Jodhpur', state: 'Rajasthan', pincode: 342001, latitude: 26.2389, longitude: 73.0243 },
  { name: 'Kota', state: 'Rajasthan', pincode: 324001, latitude: 25.2138, longitude: 75.8648 },
  { name: 'Udaipur', state: 'Rajasthan', pincode: 313001, latitude: 24.5854, longitude: 73.7125 },
  { name: 'Ajmer', state: 'Rajasthan', pincode: 305001, latitude: 26.4499, longitude: 74.6399 },
  { name: 'Bikaner', state: 'Rajasthan', pincode: 334001, latitude: 28.0229, longitude: 73.3119 },
  // Uttar Pradesh
  { name: 'Lucknow', state: 'Uttar Pradesh', pincode: 226001, latitude: 26.8467, longitude: 80.9462 },
  { name: 'Kanpur', state: 'Uttar Pradesh', pincode: 208001, latitude: 26.4499, longitude: 80.3319 },
  { name: 'Agra', state: 'Uttar Pradesh', pincode: 282001, latitude: 27.1767, longitude: 78.0081 },
  { name: 'Varanasi', state: 'Uttar Pradesh', pincode: 221001, latitude: 25.3176, longitude: 82.9739 },
  { name: 'Allahabad', state: 'Uttar Pradesh', pincode: 211001, latitude: 25.4358, longitude: 81.8463 },
  { name: 'Meerut', state: 'Uttar Pradesh', pincode: 250001, latitude: 28.9845, longitude: 77.7064 },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', pincode: 201001, latitude: 28.6692, longitude: 77.4538 },
  { name: 'Noida', state: 'Uttar Pradesh', pincode: 201301, latitude: 28.5355, longitude: 77.3910 },
  { name: 'Mathura', state: 'Uttar Pradesh', pincode: 281001, latitude: 27.4924, longitude: 77.6737 },
  { name: 'Bareilly', state: 'Uttar Pradesh', pincode: 243001, latitude: 28.3670, longitude: 79.4304 },
  // West Bengal
  { name: 'Kolkata', state: 'West Bengal', pincode: 700001, latitude: 22.5726, longitude: 88.3639 },
  { name: 'Asansol', state: 'West Bengal', pincode: 713301, latitude: 23.6889, longitude: 86.9661 },
  { name: 'Durgapur', state: 'West Bengal', pincode: 713201, latitude: 23.5204, longitude: 87.3119 },
  { name: 'Siliguri', state: 'West Bengal', pincode: 734001, latitude: 26.7271, longitude: 88.3953 },
  // Madhya Pradesh
  { name: 'Bhopal', state: 'Madhya Pradesh', pincode: 462001, latitude: 23.2599, longitude: 77.4126 },
  { name: 'Indore', state: 'Madhya Pradesh', pincode: 452001, latitude: 22.7196, longitude: 75.8577 },
  { name: 'Gwalior', state: 'Madhya Pradesh', pincode: 474001, latitude: 26.2183, longitude: 78.1828 },
  { name: 'Jabalpur', state: 'Madhya Pradesh', pincode: 482001, latitude: 23.1815, longitude: 79.9864 },
  { name: 'Ujjain', state: 'Madhya Pradesh', pincode: 456001, latitude: 23.1828, longitude: 75.7772 },
  // Punjab
  { name: 'Ludhiana', state: 'Punjab', pincode: 141001, latitude: 30.9010, longitude: 75.8573 },
  { name: 'Amritsar', state: 'Punjab', pincode: 143001, latitude: 31.6340, longitude: 74.8723 },
  { name: 'Jalandhar', state: 'Punjab', pincode: 144001, latitude: 31.3260, longitude: 75.5762 },
  { name: 'Patiala', state: 'Punjab', pincode: 147001, latitude: 30.3398, longitude: 76.3869 },
  { name: 'Mohali', state: 'Punjab', pincode: 160055, latitude: 30.7046, longitude: 76.7179 },
  // Haryana
  { name: 'Gurugram', state: 'Haryana', pincode: 122001, latitude: 28.4595, longitude: 77.0266 },
  { name: 'Faridabad', state: 'Haryana', pincode: 121001, latitude: 28.4089, longitude: 77.3178 },
  { name: 'Chandigarh', state: 'Haryana', pincode: 160001, latitude: 30.7333, longitude: 76.7794 },
  { name: 'Ambala', state: 'Haryana', pincode: 134001, latitude: 30.3782, longitude: 76.7767 },
  { name: 'Hisar', state: 'Haryana', pincode: 125001, latitude: 29.1492, longitude: 75.7217 },
  // Bihar
  { name: 'Patna', state: 'Bihar', pincode: 800001, latitude: 25.5941, longitude: 85.1376 },
  { name: 'Gaya', state: 'Bihar', pincode: 823001, latitude: 24.7914, longitude: 84.9994 },
  { name: 'Bhagalpur', state: 'Bihar', pincode: 812001, latitude: 25.2425, longitude: 86.9842 },
  { name: 'Muzaffarpur', state: 'Bihar', pincode: 842001, latitude: 26.1209, longitude: 85.3647 },
  // Odisha
  { name: 'Bhubaneswar', state: 'Odisha', pincode: 751001, latitude: 20.2961, longitude: 85.8245 },
  { name: 'Cuttack', state: 'Odisha', pincode: 753001, latitude: 20.4625, longitude: 85.8828 },
  { name: 'Rourkela', state: 'Odisha', pincode: 769001, latitude: 22.2604, longitude: 84.8536 },
  // Kerala
  { name: 'Thiruvananthapuram', state: 'Kerala', pincode: 695001, latitude: 8.5241, longitude: 76.9366 },
  { name: 'Kochi', state: 'Kerala', pincode: 682001, latitude: 9.9312, longitude: 76.2673 },
  { name: 'Kozhikode', state: 'Kerala', pincode: 673001, latitude: 11.2588, longitude: 75.7804 },
  { name: 'Thrissur', state: 'Kerala', pincode: 680001, latitude: 10.5276, longitude: 76.2144 },
  // Assam
  { name: 'Guwahati', state: 'Assam', pincode: 781001, latitude: 26.1445, longitude: 91.7362 },
  { name: 'Silchar', state: 'Assam', pincode: 788001, latitude: 24.8333, longitude: 92.7789 },
  // Jharkhand
  { name: 'Ranchi', state: 'Jharkhand', pincode: 834001, latitude: 23.3441, longitude: 85.3096 },
  { name: 'Jamshedpur', state: 'Jharkhand', pincode: 831001, latitude: 22.8046, longitude: 86.2029 },
  { name: 'Dhanbad', state: 'Jharkhand', pincode: 826001, latitude: 23.7957, longitude: 86.4304 },
  // Chhattisgarh
  { name: 'Raipur', state: 'Chhattisgarh', pincode: 492001, latitude: 21.2514, longitude: 81.6296 },
  { name: 'Bhilai', state: 'Chhattisgarh', pincode: 490001, latitude: 21.2090, longitude: 81.4285 },
  // Himachal Pradesh
  { name: 'Shimla', state: 'Himachal Pradesh', pincode: 171001, latitude: 31.1048, longitude: 77.1734 },
  { name: 'Dharamshala', state: 'Himachal Pradesh', pincode: 176215, latitude: 32.2190, longitude: 76.3234 },
  // Uttarakhand
  { name: 'Dehradun', state: 'Uttarakhand', pincode: 248001, latitude: 30.3165, longitude: 78.0322 },
  { name: 'Haridwar', state: 'Uttarakhand', pincode: 249401, latitude: 29.9457, longitude: 78.1642 },
  // Jammu & Kashmir
  { name: 'Srinagar', state: 'Jammu & Kashmir', pincode: 190001, latitude: 34.0837, longitude: 74.7973 },
  { name: 'Jammu', state: 'Jammu & Kashmir', pincode: 180001, latitude: 32.7266, longitude: 74.8570 },
  // Goa
  { name: 'Panaji', state: 'Goa', pincode: 403001, latitude: 15.4989, longitude: 73.8278 },
  { name: 'Margao', state: 'Goa', pincode: 403601, latitude: 15.2832, longitude: 74.0004 },
  // Northeast
  { name: 'Imphal', state: 'Manipur', pincode: 795001, latitude: 24.8170, longitude: 93.9368 },
  { name: 'Shillong', state: 'Meghalaya', pincode: 793001, latitude: 25.5788, longitude: 91.8933 },
  { name: 'Agartala', state: 'Tripura', pincode: 799001, latitude: 23.8315, longitude: 91.2868 },
  { name: 'Aizawl', state: 'Mizoram', pincode: 796001, latitude: 23.7307, longitude: 92.7173 },
  { name: 'Kohima', state: 'Nagaland', pincode: 797001, latitude: 25.6701, longitude: 94.1077 },
  { name: 'Gangtok', state: 'Sikkim', pincode: 737101, latitude: 27.3389, longitude: 88.6065 },
];

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

  static async bulkSeedCities(): Promise<{ inserted: number; skipped: number }> {
    let inserted = 0;
    let skipped = 0;
    for (const c of ALL_INDIA_CITIES) {
      const slug = SlugUtil.generate(`${c.name}-${c.state}`);
      const exists = await City.findOne({ slug });
      if (exists) { skipped++; continue; }
      await City.create({
        city_id: uuidv4(),
        name: c.name,
        slug,
        state: c.state,
        country: 'India',
        pincode: c.pincode,
        latitude: c.latitude,
        longitude: c.longitude,
      });
      inserted++;
    }
    return { inserted, skipped };
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
