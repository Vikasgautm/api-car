import { Document } from 'mongoose';
export interface ITagCategory extends Document {
    tag_category_id: string;
    name: string;
    slug: string;
    type: string;
    description?: string;
    is_published: boolean;
    is_deleted: boolean;
    sort_order: number;
}
export declare const TagCategory: import("mongoose").Model<ITagCategory, {}, {}, {}, Document<unknown, {}, ITagCategory, {}, import("mongoose").DefaultSchemaOptions> & ITagCategory & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ITagCategory>;
//# sourceMappingURL=tag-category.model.d.ts.map