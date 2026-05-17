import { type AiFlagKey } from './car-aggregation.service';
export interface LLMRefinementResult {
    car_id: string;
    flags_reviewed: AiFlagKey[];
    flags_unchanged: AiFlagKey[];
    flags_flipped: AiFlagKey[];
    rationale: Record<AiFlagKey, string>;
    verdicts: Record<AiFlagKey, boolean>;
    model_used: string;
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens: number;
    cache_creation_input_tokens: number;
}
export declare class CarIntelligenceLLMService {
    /**
     * Refine ambiguous AI intelligence flags for a car using Claude Haiku 4.5.
     *
     * Flow:
     *   1. Recompute aggregates via CarAggregationService (so confidence scores are fresh).
     *   2. Identify flags with confidence < AMBIGUOUS_CONFIDENCE_THRESHOLD.
     *   3. If none, return early (no LLM call, no token spend).
     *   4. Build the LLM request: cached system rubric + user-message spec snapshot
     *      + forced tool_use on `set_flag_verdicts` (strict schema = guaranteed shape).
     *   5. Apply the LLM verdicts back to the Car document, recording rationale and
     *      adding each refined flag to `ai_intelligence_meta.refined_by_llm`.
     *
     * @returns null if no ambiguous flags found (no LLM call made), or the result.
     */
    static refineAmbiguousFlags(carId: string): Promise<LLMRefinementResult | null>;
}
//# sourceMappingURL=car-intelligence-llm.service.d.ts.map