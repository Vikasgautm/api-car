"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingRankSnapshot = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    snapshot_id: { type: String, required: true, unique: true },
    score_type: { type: String, required: true },
    entity_type: { type: String, required: true, default: 'car' },
    filter_context: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    entries: [
        {
            entity_id: { type: String },
            entity_type: { type: String },
            rank: { type: Number },
            score: { type: Number },
            behavioral_confidence: { type: Number },
            trending_direction: { type: String },
            trending_velocity: { type: Number, default: 0 },
        },
    ],
    generated_at: { type: Date, default: Date.now },
    window_days: { type: Number, default: 30 },
    total_entities: { type: Number, default: 0 },
    avg_confidence: { type: Number, default: 0 },
}, { timestamps: false });
schema.index({ score_type: 1, entity_type: 1, generated_at: -1 });
schema.index({ generated_at: -1 });
schema.index({ generated_at: 1 }, { expireAfterSeconds: 365 * 24 * 3600 });
exports.RankingRankSnapshot = (0, mongoose_1.model)('RankingRankSnapshot', schema);
//# sourceMappingURL=ranking-rank-snapshot.model.js.map