"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionQualityService = void 0;
const ranking_session_model_1 = require("../../../models/ranking-session.model");
class SessionQualityService {
    static async computeForSession(sessionId, events) {
        const validEvents = events.filter(e => e.is_validated && e.event_confidence_score > 0.3);
        if (validEvents.length === 0) {
            return {
                session_quality_score: 0,
                session_confidence: 0,
                signals: this.emptySignals(),
                is_bounce: true,
            };
        }
        const attention = this.computeAttentionStrength(validEvents);
        const exploration = this.computeExplorationStrength(validEvents);
        const evaluation = this.computeEvaluationStrength(validEvents);
        const commercial = this.computeCommercialStrength(validEvents);
        const noise = this.computeNoisePenalty(events, validEvents);
        const raw = attention.attention_strength +
            exploration.exploration_strength +
            evaluation.evaluation_strength +
            commercial.commercial_strength -
            noise;
        const session_quality_score = Math.max(0, Math.min(100, raw));
        // Confidence = validated_event_count / total_event_count × quality fraction
        const validRatio = events.length > 0 ? validEvents.length / events.length : 0;
        const session_confidence = Math.min(1.0, validRatio * (session_quality_score / 100) * 1.5);
        const is_bounce = session_quality_score < 5 && validEvents.length <= 2;
        return {
            session_quality_score,
            session_confidence,
            is_bounce,
            signals: {
                attention_strength: attention.attention_strength,
                exploration_strength: exploration.exploration_strength,
                evaluation_strength: evaluation.evaluation_strength,
                commercial_strength: commercial.commercial_strength,
                noise_penalty: noise,
                time_confidence: attention.time_confidence,
                scroll_confidence: attention.scroll_confidence,
                revisit_confidence: attention.revisit_confidence,
                spec_depth_score: exploration.spec_depth_score,
                gallery_depth_score: exploration.gallery_depth_score,
                faq_depth_score: exploration.faq_depth_score,
                feature_tool_depth_score: exploration.feature_tool_depth_score,
                comparison_depth_score: evaluation.comparison_depth_score,
                variant_analysis_score: evaluation.variant_analysis_score,
                repeat_evaluation_score: evaluation.repeat_evaluation_score,
                emi_confidence: commercial.emi_confidence,
                brochure_confidence: commercial.brochure_confidence,
                dealer_confidence: commercial.dealer_confidence,
            },
        };
    }
    // ── ATTENTION STRENGTH ─────────────────────────────────────────────────────
    static computeAttentionStrength(events) {
        const time_confidence = this.computeTimeConfidence(events);
        const scroll_confidence = this.computeScrollConfidence(events);
        const revisit_confidence = this.computeRevisitConfidence(events);
        const attention_strength = Math.min(35, time_confidence + scroll_confidence + revisit_confidence);
        return { attention_strength, time_confidence, scroll_confidence, revisit_confidence };
    }
    static computeTimeConfidence(events) {
        const activeSeconds = events
            .filter(e => e.active_tab && e.duration_ms)
            .reduce((sum, e) => sum + Math.floor((e.duration_ms ?? 0) / 1000), 0);
        if (activeSeconds <= 0)
            return 0;
        // Capped logarithmic scaling — plateaus beyond ~20 minutes
        const timeScore = Math.log(activeSeconds + 1) / Math.log(1201) * 20; // max 20
        return Math.min(20, timeScore);
    }
    static computeScrollConfidence(events) {
        const scrollEvents = events.filter(e => e.event_type === 'scroll');
        if (scrollEvents.length === 0)
            return 0;
        // Continuity: more distinct scroll events = more reading behavior
        const continuityScore = Math.min(8, scrollEvents.length * 0.8);
        return continuityScore;
    }
    static computeRevisitConfidence(events) {
        const returnVisits = events.filter(e => e.event_type === 'return_visit');
        if (returnVisits.length === 0)
            return 0;
        return Math.min(7, returnVisits.length * 3.5);
    }
    // ── EXPLORATION STRENGTH ───────────────────────────────────────────────────
    static computeExplorationStrength(events) {
        const spec_depth_score = this.computeSpecDepth(events);
        const gallery_depth_score = this.computeGalleryDepth(events);
        const faq_depth_score = this.computeFaqDepth(events);
        const feature_tool_depth_score = this.computeFeatureToolDepth(events);
        const exploration_strength = Math.min(30, spec_depth_score + gallery_depth_score + faq_depth_score + feature_tool_depth_score);
        return { exploration_strength, spec_depth_score, gallery_depth_score, faq_depth_score, feature_tool_depth_score };
    }
    static computeSpecDepth(events) {
        const specEvents = events.filter(e => e.event_type === 'spec_interaction');
        if (specEvents.length === 0)
            return 0;
        const uniqueSections = new Set(specEvents.map(e => e.metadata?.section ?? 'general')).size;
        return Math.min(12, uniqueSections * 3 + specEvents.length * 0.5);
    }
    static computeGalleryDepth(events) {
        const opens = events.filter(e => e.event_type === 'gallery_open').length;
        const zooms = events.filter(e => e.event_type === 'gallery_zoom').length;
        if (opens === 0)
            return 0;
        return Math.min(8, opens * 2 + zooms * 1.5);
    }
    static computeFaqDepth(events) {
        const expands = events.filter(e => e.event_type === 'faq_expand').length;
        const reads = events.filter(e => e.event_type === 'faq_read').length;
        if (expands === 0 && reads === 0)
            return 0;
        return Math.min(5, expands * 1 + reads * 2);
    }
    static computeFeatureToolDepth(events) {
        const emiCalcs = events.filter(e => e.event_type === 'emi_calculate' || e.event_type === 'emi_customize').length;
        return Math.min(5, emiCalcs * 2.5);
    }
    // ── EVALUATION STRENGTH ────────────────────────────────────────────────────
    static computeEvaluationStrength(events) {
        const comparison_depth_score = this.computeComparisonDepth(events);
        const variant_analysis_score = this.computeVariantAnalysis(events);
        const repeat_evaluation_score = this.computeRepeatEvaluation(events);
        const evaluation_strength = Math.min(25, comparison_depth_score + variant_analysis_score + repeat_evaluation_score);
        return { evaluation_strength, comparison_depth_score, variant_analysis_score, repeat_evaluation_score };
    }
    static computeComparisonDepth(events) {
        const opens = events.filter(e => e.event_type === 'compare_open').length;
        const interactions = events.filter(e => e.event_type === 'compare_interaction' || e.event_type === 'variant_compare').length;
        if (opens === 0)
            return 0;
        // Quick exits get near-zero
        if (interactions === 0)
            return 1;
        return Math.min(12, opens * 2 + interactions * 1.5);
    }
    static computeVariantAnalysis(events) {
        const opens = events.filter(e => e.event_type === 'variant_open').length;
        const switches = events.filter(e => e.event_type === 'variant_switch').length;
        if (opens === 0)
            return 0;
        return Math.min(8, opens * 1.5 + switches * 2);
    }
    static computeRepeatEvaluation(events) {
        const evalTypes = ['spec_interaction', 'variant_compare', 'compare_interaction'];
        const evalEvents = events.filter(e => evalTypes.includes(e.event_type));
        // Distinct entity_ids evaluated = multi-comparison depth
        const distinctEntities = new Set(evalEvents.map(e => e.entity_id)).size;
        return Math.min(5, distinctEntities * 2);
    }
    // ── COMMERCIAL STRENGTH ────────────────────────────────────────────────────
    static computeCommercialStrength(events) {
        const emi_confidence = this.computeEmiConfidence(events);
        const brochure_confidence = this.computeBrochureConfidence(events);
        const dealer_confidence = this.computeDealerConfidence(events);
        const commercial_strength = Math.min(20, emi_confidence + brochure_confidence + dealer_confidence);
        return { commercial_strength, emi_confidence, brochure_confidence, dealer_confidence };
    }
    static computeEmiConfidence(events) {
        const open = events.some(e => e.event_type === 'emi_open') ? 1 : 0;
        const calc = events.filter(e => e.event_type === 'emi_calculate').length;
        const custom = events.filter(e => e.event_type === 'emi_customize').length;
        return Math.min(7, open * 1 + calc * 2 + custom * 3);
    }
    static computeBrochureConfidence(events) {
        const click = events.some(e => e.event_type === 'brochure_click') ? 2 : 0;
        const download = events.some(e => e.event_type === 'brochure_download') ? 5 : 0;
        return Math.min(6, click + download);
    }
    static computeDealerConfidence(events) {
        const view = events.some(e => e.event_type === 'dealer_view') ? 2 : 0;
        const contact = events.some(e => e.event_type === 'dealer_contact') ? 6 : 0;
        return Math.min(7, view + contact);
    }
    // ── NOISE PENALTY ──────────────────────────────────────────────────────────
    static computeNoisePenalty(allEvents, validEvents) {
        let penalty = 0;
        // Bounce: single page_view with no meaningful interaction
        if (allEvents.length <= 2 && validEvents.length === 0)
            penalty += 10;
        // Very low validation rate = spam/bot traffic
        const validRatio = allEvents.length > 0 ? validEvents.length / allEvents.length : 0;
        if (validRatio < 0.2 && allEvents.length > 5)
            penalty += 15;
        // Suspiciously high event velocity
        if (allEvents.length > 3) {
            const sorted = [...allEvents].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            const spanMs = new Date(sorted[sorted.length - 1].timestamp).getTime() - new Date(sorted[0].timestamp).getTime();
            const eventsPerSecond = allEvents.length / Math.max(1, spanMs / 1000);
            if (eventsPerSecond > 2)
                penalty += 20; // >2 events/sec is suspicious
        }
        return Math.min(30, penalty);
    }
    // ── UTILITY ────────────────────────────────────────────────────────────────
    static async recomputeAndSave(sessionId) {
        const events = await Promise.resolve().then(() => __importStar(require('../../../models/ranking-raw-event.model'))).then(m => m.RankingRawEvent.find({ session_id: sessionId }).lean());
        if (events.length === 0)
            return;
        const result = await this.computeForSession(sessionId, events);
        await ranking_session_model_1.RankingSession.updateOne({ session_id: sessionId }, {
            $set: {
                session_quality_score: result.session_quality_score,
                session_confidence: result.session_confidence,
                is_bounce: result.is_bounce,
                signals: result.signals,
                is_active: false,
                ended_at: new Date(),
            },
        });
    }
    static emptySignals() {
        return {
            attention_strength: 0, exploration_strength: 0, evaluation_strength: 0,
            commercial_strength: 0, noise_penalty: 0, time_confidence: 0,
            scroll_confidence: 0, revisit_confidence: 0, spec_depth_score: 0,
            gallery_depth_score: 0, faq_depth_score: 0, feature_tool_depth_score: 0,
            comparison_depth_score: 0, variant_analysis_score: 0,
            repeat_evaluation_score: 0, emi_confidence: 0,
            brochure_confidence: 0, dealer_confidence: 0,
        };
    }
}
exports.SessionQualityService = SessionQualityService;
//# sourceMappingURL=session-quality.service.js.map