import { Brand } from "../../../models/brand.model";
import { v4 as uuidv4 } from "uuid";
import { generateSlug } from "../../../utils/slugify";

export class BrandService {
  static async getAllBrands(query: any) {
    const { q, page = 1, limit = 10, is_deleted } = query;
    const filter: any = { is_deleted: is_deleted === "true" };

    if (q) {
      filter.brand_name = { $regex: q, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const brands = await Brand.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await Brand.countDocuments(filter);

    return { brands, total, page: Number(page), limit: Number(limit) };
  }

  static async getBrandBySlug(slug: string) {
    return await Brand.findOne({ brand_slug: slug });
  }

  static async updateBrand(id: string, brandData: any) {
    return await Brand.findOneAndUpdate({ brand_uuid: id }, brandData, {
      returnDocument: "after",
    });
  }

  static async deleteBrand(id: string) {
    return await Brand.findOneAndUpdate(
      { brand_uuid: id },
      { is_deleted: true },
      { returnDocument: "after" },
    );
  }

  static async restoreBrand(id: string) {
    return await Brand.findOneAndUpdate(
      { brand_uuid: id },
      { is_deleted: false },
      { returnDocument: "after" },
    );
  }

  static async createBrand(brandData: any) {
    const brand_uuid = uuidv4();
    const brand_slug = generateSlug(brandData.brand_name);

    return await Brand.create({
      ...brandData,
      brand_uuid,
      brand_slug,
    });
  }
}
