export interface FAQTemplate {
    key: string;
    faq_type: string;
    entity_types: string[];
    page_types: string[];
    question_template: string;
    answer_template: string;
    intent_type: string;
    priority: number;
}
export declare const AUTOMOTIVE_FAQ_TEMPLATES: FAQTemplate[];
export declare const TEMPLATE_MAP: Map<string, FAQTemplate>;
export declare function getTemplatesForEntityType(entityType: string): FAQTemplate[];
export declare function getTemplatesForPageType(pageType: string): FAQTemplate[];
export declare function getTemplatesForFaqType(faqType: string): FAQTemplate[];
export declare function interpolate(template: string, variables: Record<string, string>): string;
