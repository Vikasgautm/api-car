import { Document } from 'mongoose';
export interface IFAQ extends Document {
    faq_id: string;
    question: string;
    answer: string;
    category?: string;
    related_blog?: string;
    is_published: boolean;
    is_deleted: boolean;
    car_id?: string;
}
export declare const FAQ: import("mongoose").Model<IFAQ, {}, {}, {}, Document<unknown, {}, IFAQ, {}, import("mongoose").DefaultSchemaOptions> & IFAQ & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IFAQ>;
//# sourceMappingURL=faq.model.d.ts.map