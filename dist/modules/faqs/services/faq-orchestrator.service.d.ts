import { FAQPageType } from '../../../models/faq.model';
export interface OrchestratedFAQ {
    question: string;
    answer: string;
    faq_type: string;
    intent_type?: string;
    entity_type?: string;
    entity_id?: string;
    template_key?: string;
    faq_id?: string;
    is_dynamic: boolean;
    is_editorial: boolean;
    schema_enabled: boolean;
    indexable: boolean;
    source_type: string;
}
export interface OrchestratorResult {
    faqs: OrchestratedFAQ[];
    total: number;
    page_type: string;
    entity_type?: string;
    entity_id?: string;
    entity_name?: string;
    schema_faqs: Array<{
        question: string;
        answer: string;
    }>;
}
export declare class FAQOrchestratorService {
    static getContextualFAQs(pageType: FAQPageType, entityType?: string, entityId?: string): Promise<OrchestratorResult>;
    static invalidateCache(pageType?: string, entityType?: string, entityId?: string): void;
    private static buildFAQs;
    private static fetchEditorialFAQs;
    private static generateDynamicFAQs;
}
//# sourceMappingURL=faq-orchestrator.service.d.ts.map