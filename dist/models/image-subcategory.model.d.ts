import { Document, Schema } from 'mongoose';
export interface IImageSubCategory extends Document {
    category_id: Schema.Types.ObjectId;
    name: string;
    slug: string;
    description?: string;
    is_active: boolean;
    display_order: number;
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