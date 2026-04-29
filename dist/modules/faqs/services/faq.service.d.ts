import { IFAQ } from "../../../models/faq.model";
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
}
//# sourceMappingURL=faq.service.d.ts.map