import { City } from "../../../models/city.model";
import { v4 as uuidv4 } from "uuid";
import { generateSlug } from "../../../utils/slugify";

export class CityService {
  static async getAllCities(query: any) {
    const { q, page = 1, limit = 10, is_deleted } = query;
    const filter: any = { is_deleted: is_deleted === "true" };

    if (q) {
      filter.$or = [
        { city_name: { $regex: q, $options: "i" } },
        { state: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const cities = await City.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await City.countDocuments(filter);

    return { cities, total, page: Number(page), limit: Number(limit) };
  }

  static async updateCity(id: string, cityData: any) {
    return await City.findOneAndUpdate({ city_uuid: id }, cityData, {
      returnDocument: "after",
    });
  }

  static async deleteCity(id: string) {
    return await City.findOneAndUpdate(
      { city_uuid: id },
      { is_deleted: true },
      { returnDocument: "after" },
    );
  }

  static async restoreCity(id: string) {
    return await City.findOneAndUpdate(
      { city_uuid: id },
      { is_deleted: false },
      { returnDocument: "after" },
    );
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
