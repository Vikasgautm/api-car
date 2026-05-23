import { Document } from 'mongoose';
export interface IBodyType extends Document {
    body_type_id: string;
    name: string;
    slug: string;
    description?: string;
    seo_title?: string;
    meta_description?: string;
    intro_content?: string;
    short_description?: string;
    hero_image?: {
        url: string;
        alt?: string;
    };
    is_published: boolean;
    is_deleted: boolean;
    is_featured?: boolean;
    sort_order?: number;
    parent_id?: string;
    related_body_types?: string[];
    logo?: {
        title?: string;
        url: string;
    };
    created_by?: string;
    updated_by?: string;
    published_at?: Date;
}
export declare const BodyType: import("mongoose").Model<IBodyType, {}, {}, {}, Document<unknown, {}, IBodyType, {}, import("mongoose").DefaultSchemaOptions> & IBodyType & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IBodyType>;
//# sourceMappingURL=body-type.model.d.ts.map