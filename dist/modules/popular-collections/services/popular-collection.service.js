"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopularCollectionService = void 0;
const uuid_1 = require("uuid");
const popular_collection_model_1 = require("../../../models/popular-collection.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
class PopularCollectionService {
    static async list(status) {
        const filter = {};
        if (status)
            filter.status = status;
        return popular_collection_model_1.PopularCollection.find(filter)
            .sort({ hub_section_order: 1, createdAt: -1 })
            .lean();
    }
    static async getBySlug(slug) {
        const coll = await popular_collection_model_1.PopularCollection.findOne({ slug }).lean();
        if (!coll)
            throw new app_error_util_1.AppError(`Collection not found: ${slug}`, 404);
        return coll;
    }
    static async getById(collection_id) {
        const coll = await popular_collection_model_1.PopularCollection.findOne({ collection_id }).lean();
        if (!coll)
            throw new app_error_util_1.AppError('Collection not found', 404);
        return coll;
    }
    static async create(data, userId) {
        const existing = await popular_collection_model_1.PopularCollection.findOne({ slug: data.slug });
        if (existing)
            throw new app_error_util_1.AppError(`Slug already exists: ${data.slug}`, 400);
        const collection = new popular_collection_model_1.PopularCollection({
            ...data,
            collection_id: (0, uuid_1.v4)(),
            created_by: userId,
            updated_by: userId,
        });
        return collection.save();
    }
    static async update(collection_id, data, userId) {
        if (data.slug) {
            const existing = await popular_collection_model_1.PopularCollection.findOne({
                slug: data.slug,
                collection_id: { $ne: collection_id },
            });
            if (existing)
                throw new app_error_util_1.AppError(`Slug already exists: ${data.slug}`, 400);
        }
        const updated = await popular_collection_model_1.PopularCollection.findOneAndUpdate({ collection_id }, { ...data, updated_by: userId }, { new: true });
        if (!updated)
            throw new app_error_util_1.AppError('Collection not found', 404);
        return updated;
    }
    static async remove(collection_id) {
        const result = await popular_collection_model_1.PopularCollection.findOneAndDelete({ collection_id });
        if (!result)
            throw new app_error_util_1.AppError('Collection not found', 404);
        return result;
    }
    static async updateCarOrdering(collection_id, payload, userId) {
        const update = { updated_by: userId };
        if (payload.pinned_car_ids !== undefined)
            update.pinned_car_ids = payload.pinned_car_ids;
        if (payload.manual_car_ids !== undefined)
            update.manual_car_ids = payload.manual_car_ids;
        if (payload.suppressed_car_ids !== undefined)
            update.suppressed_car_ids = payload.suppressed_car_ids;
        const updated = await popular_collection_model_1.PopularCollection.findOneAndUpdate({ collection_id }, update, { new: true });
        if (!updated)
            throw new app_error_util_1.AppError('Collection not found', 404);
        return updated;
    }
    static async updateRenderingMode(collection_id, payload, userId) {
        const updated = await popular_collection_model_1.PopularCollection.findOneAndUpdate({ collection_id }, { ...payload, updated_by: userId }, { new: true });
        if (!updated)
            throw new app_error_util_1.AppError('Collection not found', 404);
        return updated;
    }
    static async publish(collection_id, userId) {
        const updated = await popular_collection_model_1.PopularCollection.findOneAndUpdate({ collection_id }, { status: 'published', updated_by: userId }, { new: true });
        if (!updated)
            throw new app_error_util_1.AppError('Collection not found', 404);
        return updated;
    }
    static async archive(collection_id, userId) {
        const updated = await popular_collection_model_1.PopularCollection.findOneAndUpdate({ collection_id }, { status: 'archived', updated_by: userId }, { new: true });
        if (!updated)
            throw new app_error_util_1.AppError('Collection not found', 404);
        return updated;
    }
    static async reorderHubSections(orderedIds, userId) {
        const ops = orderedIds.map((collection_id, idx) => popular_collection_model_1.PopularCollection.updateOne({ collection_id }, { hub_section_order: idx, updated_by: userId }));
        await Promise.all(ops);
    }
}
exports.PopularCollectionService = PopularCollectionService;
//# sourceMappingURL=popular-collection.service.js.map