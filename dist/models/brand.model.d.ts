import { Document } from 'mongoose';
export interface IBrand extends Document {
    brand_uuid: string;
    brand_name: string;
    brand_slug: string;
    images: {
        title: string;
        url: string;
    };
    is_published: boolean;
    is_deleted: boolean;
}
export declare const Brand: import("mongoose").Model<IBrand, {}, {}, {}, Document<unknown, {}, IBrand, {}, import("mongoose").DefaultSchemaOptions> & IBrand & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IBrand>;
//# sourceMappingURL=brand.model.d.ts.map