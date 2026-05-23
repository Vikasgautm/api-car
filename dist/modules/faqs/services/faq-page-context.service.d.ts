import { FAQPageType } from '../../../models/faq.model';
export interface PageContext {
    page_type: FAQPageType;
    entity_type?: string;
    entity_id?: string;
    entity_name?: string;
    entity_data?: Record<string, any>;
    faq_limit: number;
    applicable_faq_types: string[];
}
export declare class FAQPageContextService {
    static resolvePageContext(pageType: FAQPageType, entityType?: string, entityId?: string): Promise<PageContext>;
    static fetchEntityData(entityType: string, entityId: string): Promise<Record<string, any> | null>;
    static getPageLimit(pageType: string): number;
    static getApplicableFaqTypes(pageType: string): string[];
}
//# sourceMappingURL=faq-page-context.service.d.ts.map