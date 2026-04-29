import { Document, Schema } from 'mongoose';
export type AnswerFormat = 'text' | 'html' | 'markdown';
export interface IFAQ extends Document {
    faq_id: string;
    question: string;
    answer: string;
    category: string;
    order: number;
    tags?: string[];
    answer_format: AnswerFormat;
    faq_group?: string;
    related_cars?: Schema.Types.ObjectId[];
    related_brands?: Schema.Types.ObjectId[];
    related_blogs?: Schema.Types.ObjectId[];
    is_published: boolean;
    is_deleted: boolean;
    is_featured: boolean;
    slug: string;
    view_count?: number;
}
export declare const FAQ: import("mongoose").Model<IFAQ, {}, {}, {}, Document<unknown, {}, IFAQ, {}, import("mongoose").DefaultSchemaOptions> & IFAQ & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IFAQ>;
//# sourceMappingURL=faq.model.d.ts.map