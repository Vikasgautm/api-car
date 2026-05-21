"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelatedCollectionsService = void 0;
const seo_collection_model_1 = require("../../../models/seo-collection.model");
class RelatedCollectionsService {
    static async findRelated(collection, limit = 6) {
        if (!collection.fuel_type_ids?.length &&
            !collection.body_type_ids?.length &&
            !collection.brand_ids?.length) {
            return [];
        }
        const orClauses = [];
        if (collection.fuel_type_ids?.length) {
            orClauses.push({ fuel_type_ids: { $in: collection.fuel_type_ids } });
        }
        if (collection.body_type_ids?.length) {
            orClauses.push({ body_type_ids: { $in: collection.body_type_ids } });
        }
        if (collection.brand_ids?.length) {
            orClauses.push({ brand_ids: { $in: collection.brand_ids } });
        }
        const candidates = await seo_collection_model_1.SeoCollection.find({
            collection_id: { $ne: collection.collection_id },
            is_deleted: false,
            status: 'published',
            $or: orClauses,
        })
            .select('collection_id fuel_type_ids body_type_ids brand_ids')
            .limit(limit * 4)
            .lean();
        const scored = candidates.map(c => {
            const fuelOverlap = c.fuel_type_ids.filter((id) => collection.fuel_type_ids.includes(id)).length;
            const bodyOverlap = c.body_type_ids.filter((id) => collection.body_type_ids.includes(id)).length;
            const brandOverlap = c.brand_ids.filter((id) => collection.brand_ids.includes(id)).length;
            const score = fuelOverlap * 3 + bodyOverlap * 2 + brandOverlap;
            return { collection_id: c.collection_id, score };
        });
        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(s => s.collection_id);
    }
}
exports.RelatedCollectionsService = RelatedCollectionsService;
//# sourceMappingURL=related-collections.service.js.map