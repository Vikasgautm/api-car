export interface IComparisonRival {
    rival_id: string;
    primary_car_id: string;
    rival_car_id: string;
    relationship_strength: number;
    primary_segment?: string;
    rival_segment?: string;
    price_proximity?: number;
    manual_mapping: boolean;
    created_at: Date;
    updated_at: Date;
}
import { BaseModel } from '../sql/common/BaseModel';
export declare const ComparisonRival: BaseModel<IComparisonRival>;
