import { Document } from 'mongoose';
export interface IImageSubCategory extends Document {
    category_id: string;
    subcategory_id: string;
    name: string;
    slug: string;
    description?: string;
    is_active: boolean;
    is_published: boolean;
    sort_order: number;
    display_order?: number;
    is_deleted?: boolean;
    deleted_at?: Date;
}
export declare const ImageSubCategory: import("mongoose").Model<IImageSubCategory, {}, {}, {}, Document<unknown, {}, IImageSubCategory, {}, import("mongoose").DefaultSchemaOptions> & IImageSubCategory & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IImageSubCategory>;
//# sourceMappingURL=image-subcategory.model.d.ts.map