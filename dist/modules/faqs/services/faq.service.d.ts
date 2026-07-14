import { IFAQ } from '../../../models/faq.model';
export declare class FAQService {
    static getAllFAQs(filterDto: any, includeDeleted?: boolean): Promise<{
        faqs: (IFAQ & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getFAQById(faqId: string): Promise<(IFAQ & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static getFAQsByGroup(groupName: string): Promise<(IFAQ & import("../../../sql/common/BaseModel").SQLDocument)[]>;
    static getFeaturedFAQs(): Promise<(IFAQ & import("../../../sql/common/BaseModel").SQLDocument)[]>;
    static getFAQsByTag(tag: string): Promise<(IFAQ & import("../../../sql/common/BaseModel").SQLDocument)[]>;
    static incrementViewCount(faqId: string): Promise<IFAQ & import("../../../sql/common/BaseModel").SQLDocument>;
    static incrementClickCount(faqId: string): Promise<IFAQ & import("../../../sql/common/BaseModel").SQLDocument>;
    static togglePublish(faqId: string): Promise<IFAQ & import("../../../sql/common/BaseModel").SQLDocument>;
    static markReviewed(faqId: string): Promise<IFAQ & import("../../../sql/common/BaseModel").SQLDocument>;
    static createFAQ(faqData: any): Promise<any>;
    static updateFAQ(faqId: string, faqData: any): Promise<IFAQ & import("../../../sql/common/BaseModel").SQLDocument>;
    static deleteFAQ(faqId: string): Promise<IFAQ & import("../../../sql/common/BaseModel").SQLDocument>;
    static restoreFAQ(faqId: string): Promise<IFAQ & import("../../../sql/common/BaseModel").SQLDocument>;
    static bulkPublish(faqIds: string[]): Promise<{
        modified: number;
    }>;
    static bulkArchive(faqIds: string[]): Promise<{
        modified: number;
    }>;
    static bulkEntityAttach(faqIds: string[], entityType: string, entityId: string): Promise<{
        modified: number;
    }>;
    static bulkVisibilityUpdate(faqIds: string[], visibility_status: string): Promise<{
        modified: number;
    }>;
    static bulkSchemaEnable(faqIds: string[], schema_enabled: boolean): Promise<{
        modified: number;
    }>;
    static bulkIntentUpdate(faqIds: string[], intent_type: string): Promise<{
        modified: number;
    }>;
    static bulkRetag(faqIds: string[], tags: string[]): Promise<{
        modified: number;
    }>;
    static checkDuplicate(question: string, excludeId?: string): Promise<{
        isDuplicate: boolean;
        similarFaqId?: string;
        similarQuestion?: string;
        similarity?: number;
    }>;
}
