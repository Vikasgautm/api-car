import { v4 as uuidv4 } from "uuid";
import { BodyType } from "../../../models/body-type.model";
import { generateSlug } from "../../../utils/slugify";

export class BodyTypeService {
  static async getAllBodyTypes(query: any) {
    const { q, page = 1, limit = 10, is_deleted } = query;
    const filter: any = { is_deleted: is_deleted === "true" };

    if (q) {
      filter.body_type_name = { $regex: q, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const bodyTypes = await BodyType.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await BodyType.countDocuments(filter);

    return { body_types: bodyTypes, total, page: Number(page), limit: Number(limit) };
  }

  static async getBodyTypeBySlug(slug: string) {
    return await BodyType.findOne({ slug });
  }

  static async getBodyTypeById(id: string) {
    return await BodyType.findOne({ body_type_id: id });
  }

  static async updateBodyType(id: string, bodyTypeData: any) {
    let updateData = { ...bodyTypeData };
    console.log(updateData, "updateData");
    if (updateData.is_published !== undefined) {
      // Handle both string "true"/"false" and boolean true/false
      if (typeof updateData.is_published === "string") {
        updateData.is_published = updateData.is_published === "true";
      }
      // If it's already a boolean, keep it as is
    }
    return await BodyType.findOneAndUpdate({ body_type_id: id }, updateData, {
      returnDocument: "after",
    });
  }

  static async deleteBodyType(id: string) {
    return await BodyType.findOneAndUpdate(
      { body_type_id: id },
      { is_deleted: true },
      { returnDocument: "after" },
    );
  }

  static async restoreBodyType(id: string) {
    return await BodyType.findOneAndUpdate(
      { body_type_id: id },
      { is_deleted: false },
      { returnDocument: "after" },
    );
  }

  static async createBodyType(bodyTypeData: any) {
    const body_type_id = uuidv4();
    const slug = generateSlug(bodyTypeData.body_type_name);
    return await BodyType.create({
      ...bodyTypeData,
      body_type_id,
      slug,
    });
  }
}
