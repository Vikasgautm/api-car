"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingSession = void 0;
const mongoose_1 = require("mongoose");
const signalFields = {};
const signalKeys = [
    'attention_strength', 'exploration_strength', 'evaluation_strength',
    'commercial_strength', 'noise_penalty', 'time_confidence', 'scroll_confidence',
    'revisit_confidence', 'spec_depth_score', 'gallery_depth_score',
    'faq_depth_score', 'feature_tool_depth_score', 'comparison_depth_score',
    'variant_analysis_score', 'repeat_evaluation_score', 'emi_confidence',
    'brochure_confidence', 'dealer_confidence',
];
signalKeys.forEach(k => { signalFields[k] = { type: Number, default: 0 }; });
const schema = new mongoose_1.Schema({
    session_id: { type: String, required: true, unique: true },
    user_id: { type: String, default: null },
    anonymous_id: { type: String, default: null },
    entity_ids: [{ type: String }],
    primary_entity_id: { type: String, default: null },
    started_at: { type: Date, required: true },
    ended_at: { type: Date, default: null },
    is_active: { type: Boolean, default: true },
    last_event_at: { type: Date, required: true },
    event_count: { type: Number, default: 0 },
    validated_event_count: { type: Number, default: 0 },
    active_seconds: { type: Number, default: 0 },
    session_quality_score: { type: Number, default: 0 },
    session_confidence: { type: Number, default: 0 },
    signals: signalFields,
    device_type: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    traffic_source: { type: String, default: null },
    is_bounce: { type: Boolean, default: false },
    has_comparison: { type: Boolean, default: false },
    has_commercial_intent: { type: Boolean, default: false },
}, { timestamps: true });
schema.index({ entity_ids: 1, started_at: -1 });
schema.index({ primary_entity_id: 1, started_at: -1 });
schema.index({ is_active: 1, last_event_at: 1 });
schema.index({ session_quality_score: -1 });
schema.index({ started_at: -1 });
schema.index({ started_at: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });
exports.RankingSession = (0, mongoose_1.model)('RankingSession', schema);
