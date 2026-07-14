import { IFAQ } from '../../../models/faq.model';
import { GeneratedFAQ } from './faq-template-engine.service';
type AnyFAQ = Partial<IFAQ> & {
    question: string;
    answer: string;
    priority_score?: number;
    faq_type?: string;
    entity_type?: string;
    entity_id?: string;
};
interface RelevanceContext {
    page_type: string;
    entity_type?: string;
    entity_id?: string;
    applicable_faq_types: string[];
}
export declare class FAQRelevanceService {
    static scoreRelevance(faq: AnyFAQ, context: RelevanceContext): number;
    static rankFAQs(faqs: AnyFAQ[], context: RelevanceContext): AnyFAQ[];
    static applyPageLimit(faqs: AnyFAQ[], limit: number): AnyFAQ[];
    static rankGeneratedFAQs(faqs: GeneratedFAQ[], context: RelevanceContext): GeneratedFAQ[];
    private static scoreGeneratedFAQ;
}
export {};
