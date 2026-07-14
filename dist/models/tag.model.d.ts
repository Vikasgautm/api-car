export interface ITag {
    tag_id: string;
    tag_category_id: string;
    name: string;
    slug: string;
    description?: string;
    seo_meta?: {
        title?: string;
        description?: string;
        h1?: string;
    };
    is_published: boolean;
    is_deleted: boolean;
    sort_order: number;
}
import { BaseModel } from '../sql/common/BaseModel';
export declare const Tag: BaseModel<ITag>;
