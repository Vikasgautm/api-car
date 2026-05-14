import { Document } from 'mongoose';
export interface ITag extends Document {
    tag_id: string;
    tag_category_id: string;
    name: string;
    slug: string;
    description?: string;
    seo_meta?: {
        title?: string;
        description?: string;
        h1?: string;
    };
    is_published: boolean;
    is_deleted: boolean;
    sort_order: number;
}
export declare const Tag: import("mongoose").Model<ITag, {}, {}, {}, Document<unknown, {}, ITag, {}, import("mongoose").DefaultSchemaOptions> & ITag & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ITag>;
//# sourceMappingURL=tag.model.d.ts.map