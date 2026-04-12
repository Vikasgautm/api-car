export declare class FAQService {
    static getAllFAQs(query: any, fetchAsAdmin?: boolean): Promise<{
        faqs: (import("mongoose").Document<unknown, {}, import("../../../models/faq.model").IFAQ, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/faq.model").IFAQ & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    static getFAQsByGroup(groupName: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/faq.model").IFAQ, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/faq.model").IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    static getFeaturedFAQs(): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/faq.model").IFAQ, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/faq.model").IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    static getFAQsByTag(tag: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/faq.model").IFAQ, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/faq.model").IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    static incrementViewCount(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/faq.model").IFAQ, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/faq.model").IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static togglePublish(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/faq.model").IFAQ, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/faq.model").IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static updateFAQ(id: string, faqData: any): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/faq.model").IFAQ, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/faq.model").IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static deleteFAQ(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/faq.model").IFAQ, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/faq.model").IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static restoreFAQ(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/faq.model").IFAQ, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/faq.model").IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static createFAQ(faqData: any): Promise<import("mongoose").Document<unknown, {}, import("../../../models/faq.model").IFAQ, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/faq.model").IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=faq.service.d.ts.map