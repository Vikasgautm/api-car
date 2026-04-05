import { CarVariant } from "../../../models/car-variant.model";
import { v4 as uuidv4 } from "uuid";
import { generateSlug } from "../../../utils/slugify";

export class CarVariantService {
  static async getAllVariants(query: any, fetchAsAdmin = false) {
    const { car_id, page = 1, limit = 10, q, is_deleted } = query;

    const filter: any = { is_deleted: is_deleted === "true" };
    if (!fetchAsAdmin && is_deleted !== "true") {
      filter.is_published = true;
    }

    if (car_id) filter.car_id = car_id;
    if (q) filter.variant_name = { $regex: q, $options: "i" };

    const skip = ((Number(page) || 1) - 1) * (Number(limit) || 10);
    const variants = await CarVariant.find(filter)
      .populate("car_id", "car_name slug")
      .skip(skip)
      .limit(Number(limit) || 10)
      .sort({ createdAt: -1 });

    const total = await CarVariant.countDocuments(filter);

    return {
      variants,
      total,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    };
  }

  static async getVariantBySlug(slug: string) {
    return await CarVariant.findOne({ slug, is_deleted: false }).populate(
      "car_id",
    );
  }

  static async createVariant(variantData: any) {
    const variant_id = uuidv4();
    let slug = generateSlug(variantData.variant_name);

    const existing = await CarVariant.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    return await CarVariant.create({
      ...variantData,
      variant_id,
      slug,
    });
  }

  static async updateVariant(id: string, variantData: any) {
    if (variantData.variant_name) {
      variantData.slug = generateSlug(variantData.variant_name);
    }
    return await CarVariant.findByIdAndUpdate(id, variantData, {
      returnDocument: "after",
    });
  }

  static async deleteVariant(id: string) {
    return await CarVariant.findByIdAndUpdate(
      id,
      { is_deleted: true },
      { returnDocument: "after" },
    );
  }

  static async restoreVariant(id: string) {
    return await CarVariant.findByIdAndUpdate(
      id,
      { is_deleted: false },
      { returnDocument: "after" },
    );
  }
}
