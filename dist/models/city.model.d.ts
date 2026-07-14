export interface ICity {
    city_id: string;
    name: string;
    slug: string;
    state: string;
    country?: string;
    pincode?: string;
    longitude?: number;
    latitude?: number;
    is_published?: boolean;
    is_featured?: boolean;
    noindex?: boolean;
    is_deleted?: boolean;
    deleted_at?: Date;
}
import { BaseModel } from '../sql/common/BaseModel';
export declare const City: BaseModel<ICity>;
