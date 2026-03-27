import { City } from '../../../models/city.model';
import { v4 as uuidv4 } from 'uuid';
import { generateSlug } from '../../../utils/slugify';

export class CityService {
  static async getAllCities(query: any) {
    const { q, page = 1, limit = 10 } = query;
    const filter: any = { is_deleted: false };

    if (q) {
      filter.$or = [
        { city_name: { $regex: q, $options: 'i' } },
        { state: { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const cities = await City.find(filter).skip(skip).limit(Number(limit));
    const total = await City.countDocuments(filter);

    return { cities, total, page, limit };
  }

  static async createCity(cityData: any) {
    const city_uuid = uuidv4();
    const slug = generateSlug(cityData.city_name);
    
    return await City.create({
      ...cityData,
      city_uuid,
      slug,
    });
  }
}
