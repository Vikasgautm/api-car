"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingScore = void 0;
const mongoose_1 = require("mongoose");
const rawSignalFields = {};
const rsKeys = [
    'qualified_attention', 'qualified_exploration', 'qualified_evaluation',
    'qualified_commercial', 'qualified_retention', 'qualified_comparison',
    'attention_acceleration', 'evaluation_acceleration',
    'search_acceleration', 'commercial_acceleration',
];
rsKeys.forEach(k => { rawSignalFields[k] = { type: Number, default: 0 }; });
const schema = new mongoose_1.Schema({
    score_id: { type: String, required: true, unique: true },
    entity_type: { type: String, required: true },
    entity_id: { type: String, required: true },
    popularity_score: { type: Number, default: 0 },
    trending_score: { type: Number, default: 0 },
    engagement_score: { type: Number, default: 0 },
    buyer_intent_score: { type: Number, default: 0 },
    comparison_pressure_score: { type: Number, default: 0 },
    retention_score: { type: Number, default: 0 },
    raw_signals: rawSignalFields,
    computed_at: { type: Date, default: Date.now },
    window_days: { type: Number, default: 30 },
    session_count: { type: Number, default: 0 },
    behavioral_confidence: { type: Number, default: 0 },
    trending_direction: { type: String, default: 'stable' },
    trending_velocity: { type: Number, default: 0 },
    rank_position: { type: Number, default: null },
    is_anomaly: { type: Boolean, default: false },
    prev_popularity_score: { type: Number, default: 0 },
    prev_trending_score: { type: Number, default: 0 },
}, { timestamps: true });
schema.index({ entity_type: 1, entity_id: 1 }, { unique: true });
schema.index({ entity_type: 1, popularity_score: -1 });
schema.index({ entity_type: 1, trending_score: -1 });
schema.index({ entity_type: 1, engagement_score: -1 });
schema.index({ entity_type: 1, buyer_intent_score: -1 });
schema.index({ entity_type: 1, comparison_pressure_score: -1 });
schema.index({ entity_type: 1, retention_score: -1 });
schema.index({ behavioral_confidence: -1 });
schema.index({ computed_at: -1 });
exports.RankingScore = (0, mongoose_1.model)('RankingScore', schema);
//# sourceMappingURL=ranking-score.model.js.map