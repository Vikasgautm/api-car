export interface IBodyType {
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
import { BaseModel } from '../sql/common/BaseModel';
export declare const BodyType: BaseModel<IBodyType>;
