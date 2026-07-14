export interface IUnknownValue {
    unknown_id: string;
    category_key: string;
    raw_value: string;
    context?: string;
    occurrence_count: number;
    is_resolved: boolean;
    resolved_to?: string;
    resolved_at?: Date;
    created_at: Date;
    updated_at: Date;
}
import { BaseModel } from '../../../sql/common/BaseModel';
export declare const UnknownValue: BaseModel<IUnknownValue>;
