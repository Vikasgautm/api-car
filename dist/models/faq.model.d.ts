import { Document } from 'mongoose';
export declare enum FAQCategory {
    GENERAL = "General",
    BUYING_GUIDE = "Buying Guide",
    MAINTENANCE = "Maintenance",
    COMPARISON = "Comparison",
    FINANCING = "Financing",
    DOCUMENTATION = "Documentation",
    TECHNICAL = "Technical",
    OTHER = "Other"
}
export declare enum AnswerFormat {
    TEXT = "text",
    HTML = "html",
    MARKDOWN = "markdown"
}
export interface IFAQ extends Document {
    faq_id: string;
    question: string;
    answer: string;
    category: FAQCategory;
    order: number;
    tags: string[];
    answer_format: AnswerFormat;
    view_count: number;
    faq_group?: string;
    related_cars: string[];
    related_brands: string[];
    related_blogs: string[];
    is_published: boolean;
    is_deleted: boolean;
    is_featured: boolean;
    slug: string;
}
export declare const FAQ: import("mongoose").Model<IFAQ, {}, {}, {}, Document<unknown, {}, IFAQ, {}, import("mongoose").DefaultSchemaOptions> & IFAQ & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IFAQ>;
//# sourceMappingURL=faq.model.d.ts.map