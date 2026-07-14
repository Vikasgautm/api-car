export type RedirectType = '301' | '302';
export interface IRedirect {
    redirect_id: string;
    old_url: string;
    new_url: string;
    type: RedirectType;
    reason?: string | null;
    created_by?: string | null;
    hit_count: number;
    last_hit_at?: Date | null;
    is_deleted: boolean;
}
import { BaseModel } from '../sql/common/BaseModel';
export declare const Redirect: BaseModel<IRedirect>;
