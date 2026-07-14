export interface IFuelType {
    fuel_type_id: string;
    name: string;
    slug: string;
    description?: string;
    is_published: boolean;
    is_deleted: boolean;
    is_featured?: boolean;
    logo?: {
        title?: string;
        url: string;
    };
}
import { BaseModel } from '../sql/common/BaseModel';
export declare const FuelType: BaseModel<IFuelType>;
