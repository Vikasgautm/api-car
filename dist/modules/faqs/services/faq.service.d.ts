import { IFAQ } from '../../../models/faq.model';
export declare class FAQService {
    static getAllFAQs(filterDto: any, includeDeleted?: boolean): Promise<{
        faqs: (import("mongoose").Document<unknown, {}, IFAQ, {}, import("mongoose").DefaultSchemaOptions> & IFAQ & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getFAQById(faqId: string): Promise<(import("mongoose").Document<unknown, {}, IFAQ, {}, import("mongoose").DefaultSchemaOptions> & IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static getFAQsByGroup(groupName: string): Promise<(import("mongoose").Document<unknown, {}, IFAQ, {}, import("mongoose").DefaultSchemaOptions> & IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    static getFeaturedFAQs(): Promise<(import("mongoose").Document<unknown, {}, IFAQ, {}, import("mongoose").DefaultSchemaOptions> & IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    static getFAQsByTag(tag: string): Promise<(import("mongoose").Document<unknown, {}, IFAQ, {}, import("mongoose").DefaultSchemaOptions> & IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    static incrementViewCount(faqId: string): Promise<import("mongoose").Document<unknown, {}, IFAQ, {}, import("mongoose").DefaultSchemaOptions> & IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static incrementClickCount(faqId: string): Promise<import("mongoose").Document<unknown, {}, IFAQ, {}, import("mongoose").DefaultSchemaOptions> & IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static togglePublish(faqId: string): Promise<import("mongoose").Document<unknown, {}, IFAQ, {}, import("mongoose").DefaultSchemaOptions> & IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static createFAQ(faqData: any): Promise<import("mongoose").Document<unknown, {}, IFAQ, {}, import("mongoose").DefaultSchemaOptions> & IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateFAQ(faqId: string, faqData: any): Promise<import("mongoose").Document<unknown, {}, IFAQ, {}, import("mongoose").DefaultSchemaOptions> & IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static deleteFAQ(faqId: string): Promise<import("mongoose").Document<unknown, {}, IFAQ, {}, import("mongoose").DefaultSchemaOptions> & IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static restoreFAQ(faqId: string): Promise<import("mongoose").Document<unknown, {}, IFAQ, {}, import("mongoose").DefaultSchemaOptions> & IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
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
//# sourceMappingURL=faq.service.d.ts.map