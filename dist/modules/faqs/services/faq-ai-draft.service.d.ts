export interface FAQDraftInput {
    entity_type?: string;
    entity_id?: string;
    topic?: string;
    existing_question?: string;
}
export interface FAQDraft {
    question: string;
    answer: string;
    suggested_tags: string[];
    faq_type: string;
    canonical_intent_key?: string;
    intent_type?: string;
    entity_type?: string;
    entity_id?: string;
    source_type: 'ai';
    model_used: string;
}
export declare class FAQAIDraftService {
    /**
     * Draft a single FAQ for an entity using the platform LLM (Cerebras).
     *
     * Mirrors CarIntelligenceLLMService: honours the `ai_intelligence` emergency
     * kill switch, reads the configured model, and forces a strict tool call so the
     * returned shape is guaranteed. The draft is NOT persisted — the editor reviews
     * and saves it via the normal create/update flow with source_type='ai'.
     */
    static draftFAQ(input: FAQDraftInput): Promise<FAQDraft>;
    /**
     * Build a compact, factual context snapshot for the entity. Reads cached
     * aggregate fields off the Car document (no heavy recompute) and the parent
     * car's embedded variant subdocument for variants.
     */
    private static buildEntityContext;
    private static serializeCar;
}
//# sourceMappingURL=faq-ai-draft.service.d.ts.map