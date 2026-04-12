"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyTypeService = void 0;
const uuid_1 = require("uuid");
const body_type_model_1 = require("../../../models/body-type.model");
const slugify_1 = require("../../../utils/slugify");
class BodyTypeService {
    static async getAllBodyTypes(query) {
        const { q, page = 1, limit = 10, is_deleted } = query;
        const filter = { is_deleted: is_deleted === "true" };
        if (q) {
            filter.body_type_name = { $regex: q, $options: "i" };
        }
        const skip = (Number(page) - 1) * Number(limit);
        const bodyTypes = await body_type_model_1.BodyType.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await body_type_model_1.BodyType.countDocuments(filter);
        return { body_types: bodyTypes, total, page: Number(page), limit: Number(limit) };
    }
    static async getBodyTypeBySlug(slug) {
        return await body_type_model_1.BodyType.findOne({ slug });
    }
    static async getBodyTypeById(id) {
        return await body_type_model_1.BodyType.findOne({ body_type_id: id });
    }
    static async updateBodyType(id, bodyTypeData) {
        let updateData = { ...bodyTypeData };
        console.log(updateData, "updateData");
        if (updateData.is_published !== undefined) {
            // Handle both string "true"/"false" and boolean true/false
            if (typeof updateData.is_published === "string") {
                updateData.is_published = updateData.is_published === "true";
            }
            // If it's already a boolean, keep it as is
        }
        return await body_type_model_1.BodyType.findOneAndUpdate({ body_type_id: id }, updateData, {
            returnDocument: "after",
        });
    }
    static async deleteBodyType(id) {
        return await body_type_model_1.BodyType.findOneAndUpdate({ body_type_id: id }, { is_deleted: true }, { returnDocument: "after" });
    }
    static async restoreBodyType(id) {
        return await body_type_model_1.BodyType.findOneAndUpdate({ body_type_id: id }, { is_deleted: false }, { returnDocument: "after" });
    }
    static async createBodyType(bodyTypeData) {
        const body_type_id = (0, uuid_1.v4)();
        const slug = (0, slugify_1.generateSlug)(bodyTypeData.body_type_name);
        return await body_type_model_1.BodyType.create({
            ...bodyTypeData,
            body_type_id,
            slug,
        });
    }
}
exports.BodyTypeService = BodyTypeService;
//# sourceMappingURL=bodyType.service.js.map