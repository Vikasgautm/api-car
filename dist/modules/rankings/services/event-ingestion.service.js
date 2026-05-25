"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventIngestionService = void 0;
const uuid_1 = require("uuid");
const ranking_raw_event_model_1 = require("../../../models/ranking-raw-event.model");
const ranking_session_model_1 = require("../../../models/ranking-session.model");
// High-value events that signal genuine buyer evaluation
const HIGH_VALUE_EVENTS = new Set([
    'spec_interaction', 'variant_compare', 'compare_interaction',
    'gallery_zoom', 'faq_read', 'emi_calculate', 'emi_customize',
    'brochure_download', 'dealer_contact', 'city_price_lookup',
    'wishlist_add', 'return_visit',
]);
const COMMERCIAL_EVENTS = new Set([
    'emi_open', 'emi_calculate', 'emi_customize',
    'brochure_click', 'brochure_download',
    'dealer_view', 'dealer_contact',
    'wishlist_add', 'city_price_lookup',
]);
class EventIngestionService {
    static async ingest(dto) {
        if (!ranking_raw_event_model_1.VALID_EVENT_TYPES.includes(dto.event_type)) {
            throw new Error(`Unknown event_type: ${dto.event_type}`);
        }
        if (!dto.entity_id || !dto.entity_type || !dto.session_id) {
            throw new Error('entity_id, entity_type, session_id are required');
        }
        const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();
        const confidence = this.computeEventConfidence(dto, timestamp);
        const event = await ranking_raw_event_model_1.RankingRawEvent.create({
            event_id: (0, uuid_1.v4)(),
            event_type: dto.event_type,
            entity_type: dto.entity_type,
            entity_id: dto.entity_id,
            variant_id: dto.variant_id ?? undefined,
            session_id: dto.session_id,
            user_id: dto.user_id ?? undefined,
            anonymous_id: dto.anonymous_id ?? undefined,
            timestamp,
            page_url: dto.page_url ?? undefined,
            referrer: dto.referrer ?? undefined,
            traffic_source: dto.traffic_source ?? undefined,
            device_type: dto.device_type ?? undefined,
            city: dto.city ?? undefined,
            state: dto.state ?? undefined,
            active_tab: dto.active_tab !== false,
            duration_ms: dto.duration_ms ?? undefined,
            metadata: dto.metadata ?? {},
            event_confidence_score: confidence,
            is_validated: confidence > 0.3,
        });
        await this.upsertSession(event, confidence);
        return event;
    }
    static async ingestBatch(events) {
        let accepted = 0;
        let rejected = 0;
        for (const dto of events) {
            try {
                await this.ingest(dto);
                accepted++;
            }
            catch {
                rejected++;
            }
        }
        return { accepted, rejected };
    }
    static computeEventConfidence(dto, timestamp) {
        let base = 0.5;
        // High-value interactions get baseline boost
        if (HIGH_VALUE_EVENTS.has(dto.event_type))
            base = 0.75;
        if (COMMERCIAL_EVENTS.has(dto.event_type))
            base = 0.80;
        // Background tab degrades confidence significantly
        const visibilityMultiplier = dto.active_tab === false ? 0.3 : 1.0;
        // Future timestamps are suspicious
        const now = Date.now();
        const tsMs = timestamp.getTime();
        const timeDrift = Math.abs(now - tsMs);
        const driftPenalty = timeDrift > 5 * 60 * 1000 ? 0.7 : 1.0; // >5min drift
        // Duration sanity for timed events
        let durationQuality = 1.0;
        if (dto.duration_ms !== undefined) {
            if (dto.duration_ms < 0)
                durationQuality = 0;
            else if (dto.duration_ms > 60 * 60 * 1000)
                durationQuality = 0.5; // >1hr unrealistic
        }
        const score = base * visibilityMultiplier * driftPenalty * durationQuality;
        return Math.min(1.0, Math.max(0.0, score));
    }
    static async upsertSession(event, confidence) {
        const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
        const now = event.timestamp;
        const existing = await ranking_session_model_1.RankingSession.findOne({ session_id: event.session_id });
        if (!existing) {
            const hasCommercial = COMMERCIAL_EVENTS.has(event.event_type);
            const hasComparison = (event.event_type === 'compare_open' || event.event_type === 'compare_interaction' || event.event_type === 'variant_compare');
            await ranking_session_model_1.RankingSession.create({
                session_id: event.session_id,
                user_id: event.user_id ?? undefined,
                anonymous_id: event.anonymous_id ?? undefined,
                entity_ids: [event.entity_id],
                primary_entity_id: event.entity_id,
                started_at: now,
                last_event_at: now,
                is_active: true,
                event_count: 1,
                validated_event_count: event.is_validated ? 1 : 0,
                active_seconds: 0,
                session_quality_score: 0,
                session_confidence: confidence,
                device_type: event.device_type ?? undefined,
                city: event.city ?? undefined,
                state: event.state ?? undefined,
                traffic_source: event.traffic_source ?? undefined,
                is_bounce: false,
                has_comparison: hasComparison,
                has_commercial_intent: hasCommercial,
                signals: {
                    attention_strength: 0, exploration_strength: 0,
                    evaluation_strength: 0, commercial_strength: 0,
                    noise_penalty: 0, time_confidence: 0, scroll_confidence: 0,
                    revisit_confidence: 0, spec_depth_score: 0, gallery_depth_score: 0,
                    faq_depth_score: 0, feature_tool_depth_score: 0,
                    comparison_depth_score: 0, variant_analysis_score: 0,
                    repeat_evaluation_score: 0, emi_confidence: 0,
                    brochure_confidence: 0, dealer_confidence: 0,
                },
            });
            return;
        }
        // Close session if too much inactivity
        const msSinceLastEvent = now.getTime() - existing.last_event_at.getTime();
        if (msSinceLastEvent > INACTIVITY_LIMIT_MS) {
            await ranking_session_model_1.RankingSession.updateOne({ session_id: event.session_id }, { is_active: false, ended_at: existing.last_event_at });
            // Start a new logical session — use the same session_id (frontend manages session IDs)
            // Just re-open it as active with updated timestamp
        }
        const addActive = event.active_tab !== false && event.duration_ms ? Math.floor(event.duration_ms / 1000) : 0;
        const entityIds = existing.entity_ids.includes(event.entity_id)
            ? existing.entity_ids
            : [...existing.entity_ids, event.entity_id];
        const hasCommercial = existing.has_commercial_intent || COMMERCIAL_EVENTS.has(event.event_type);
        const hasComparison = existing.has_comparison || (event.event_type === 'compare_open' || event.event_type === 'compare_interaction' || event.event_type === 'variant_compare');
        await ranking_session_model_1.RankingSession.updateOne({ session_id: event.session_id }, {
            $set: {
                last_event_at: now,
                is_active: true,
                entity_ids: entityIds,
                has_comparison: hasComparison,
                has_commercial_intent: hasCommercial,
            },
            $inc: {
                event_count: 1,
                validated_event_count: event.is_validated ? 1 : 0,
                active_seconds: addActive,
            },
        });
    }
}
exports.EventIngestionService = EventIngestionService;
//# sourceMappingURL=event-ingestion.service.js.map