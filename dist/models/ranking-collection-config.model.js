"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingCollectionConfig = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    config_id: { type: String, required: true, unique: true },
    collection_key: { type: String, required: true, unique: true },
    collection_label: { type: String, required: true },
    collection_category: { type: String, default: 'general' },
    rendering_mode: { type: String, default: 'observe_only' },
    manual_weight: { type: Number, default: 70, min: 0, max: 100 },
    behavioral_weight: { type: Number, default: 30, min: 0, max: 100 },
    min_behavioral_confidence: { type: Number, default: 70, min: 0, max: 100 },
    score_type: { type: String, default: 'popularity' },
    filter_context: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    pinned_entity_ids: [{ type: String }],
    suppressed_entity_ids: [{ type: String }],
    editorial_boosts: [
        {
            entity_id: { type: String },
            boost_score: { type: Number },
            expires_at: { type: Date, default: null },
            reason: { type: String, default: null },
        },
    ],
    is_active: { type: Boolean, default: true },
    notes: { type: String, default: null },
}, { timestamps: true });
schema.index({ collection_key: 1 });
schema.index({ rendering_mode: 1 });
schema.index({ is_active: 1 });
exports.RankingCollectionConfig = (0, mongoose_1.model)('RankingCollectionConfig', schema);
//# sourceMappingURL=ranking-collection-config.model.js.map