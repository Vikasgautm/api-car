export declare class FAQService {
    static getAllFAQs(query: any): Promise<{
        faqs: (import("mongoose").Document<unknown, {}, import("../../../models/faq.model").IFAQ, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/faq.model").IFAQ & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: any;
        limit: any;
    }>;
    static createFAQ(faqData: any): Promise<import("mongoose").Document<unknown, {}, import("../../../models/faq.model").IFAQ, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/faq.model").IFAQ & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=faq.service.d.ts.map