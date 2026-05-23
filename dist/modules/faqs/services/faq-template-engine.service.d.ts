import { FAQTemplate } from '../templates/automotive-templates';
export interface GeneratedFAQ {
    question: string;
    answer: string;
    faq_type: string;
    intent_type: string;
    template_key: string;
    entity_type: string;
    entity_id: string;
    is_dynamic: true;
    source_type: 'template';
    priority_score: number;
    schema_enabled: boolean;
    indexable: boolean;
}
export declare class FAQTemplateEngineService {
    static generateVariantFAQs(variantId: string): Promise<GeneratedFAQ[]>;
    static generateCarFAQs(carId: string): Promise<GeneratedFAQ[]>;
    static generateBrandFAQs(brandId: string): Promise<GeneratedFAQ[]>;
    static generateFuelTypeFAQs(fuelTypeId: string): Promise<GeneratedFAQ[]>;
    static generateComparisonFAQs(carIds: string[]): Promise<GeneratedFAQ[]>;
    static generateCollectionFAQs(params: {
        collection_label: string;
        body_type?: string;
        fuel_type?: string;
        budget_label?: string;
        top_car_names?: string[];
    }): Promise<GeneratedFAQ[]>;
    static renderTemplate(templateKey: string, variables: Record<string, string>): {
        question: string;
        answer: string;
    } | null;
    static getTemplatesForPage(pageType: string): FAQTemplate[];
    static getTemplatesForEntity(entityType: string): FAQTemplate[];
    static getAllTemplates(): FAQTemplate[];
    private static buildFAQ;
}
//# sourceMappingURL=faq-template-engine.service.d.ts.map