import { Document } from 'mongoose';
export interface ICity extends Document {
    city_id: string;
    name: string;
    slug: string;
    state: string;
    country?: string;
    pincode?: string;
    longitude?: number;
    latitude?: number;
    city_logo?: string;
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
export declare const City: import("mongoose").Model<ICity, {}, {}, {}, Document<unknown, {}, ICity, {}, import("mongoose").DefaultSchemaOptions> & ICity & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICity>;
//# sourceMappingURL=city.model.d.ts.map