import { Document, Schema } from "mongoose";
export interface ICar extends Document {
    car_id: string;
    car_name: string;
    description: string;
    slug: string;
    brand_id: Schema.Types.ObjectId;
    body_type_id: string;
    thumbnail: {
        preview: string;
        title: string;
    };
    images: Array<{
        preview: string;
        title: string;
    }>;
    link: string;
    upcoming: boolean;
    recommended: boolean;
    popular: boolean;
    latest: boolean;
    electric: boolean;
    is_published: boolean;
    is_deleted: boolean;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_image?: string;
    canonical_url?: string;
    noindex?: boolean;
}
export declare const Car: import("mongoose").Model<ICar, {}, {}, {}, Document<unknown, {}, ICar, {}, import("mongoose").DefaultSchemaOptions> & ICar & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICar>;
//# sourceMappingURL=car.model.d.ts.map