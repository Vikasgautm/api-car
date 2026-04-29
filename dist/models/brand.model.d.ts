import { Document } from 'mongoose';
export interface IBrand extends Document {
    brand_id: string;
    name: string;
    slug: string;
    description?: string;
    logo?: {
        title?: string;
        url: string;
    };
    website?: string;
    is_published: boolean;
    is_deleted: boolean;
    is_featured?: boolean;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_image?: string;
    canonical_url?: string;
    noindex?: boolean;
}
export declare const Brand: import("mongoose").Model<IBrand, {}, {}, {}, Document<unknown, {}, IBrand, {}, import("mongoose").DefaultSchemaOptions> & IBrand & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IBrand>;
//# sourceMappingURL=brand.model.d.ts.map