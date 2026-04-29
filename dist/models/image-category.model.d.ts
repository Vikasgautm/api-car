import { Document } from 'mongoose';
export interface IImageCategory extends Document {
    name: string;
    slug: string;
    description?: string;
    is_active: boolean;
    display_order: number;
    is_deleted?: boolean;
    deleted_at?: Date;
}
export declare const ImageCategory: import("mongoose").Model<IImageCategory, {}, {}, {}, Document<unknown, {}, IImageCategory, {}, import("mongoose").DefaultSchemaOptions> & IImageCategory & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IImageCategory>;
//# sourceMappingURL=image-category.model.d.ts.map