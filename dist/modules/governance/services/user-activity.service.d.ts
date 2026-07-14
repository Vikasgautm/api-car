export interface ActivityFilters {
    user_id?: string;
    entity_type?: string;
    action?: string;
    brand_id?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
}
export declare class UserActivityService {
    static getUserActivity(userId: string, filters?: ActivityFilters): Promise<{
        logs: (import("mongoose").Document<unknown, {}, import("../../../models/audit-log.model").IAuditLog, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/audit-log.model").IAuditLog & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    static getAllActivity(filters?: ActivityFilters): Promise<{
        logs: (import("mongoose").Document<unknown, {}, import("../../../models/audit-log.model").IAuditLog, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/audit-log.model").IAuditLog & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    static getUserActivitySummary(userId: string): Promise<{
        total_edits: number;
        today_edits: number;
        week_edits: number;
        by_action: any[];
    }>;
    static getCrossUserActivitySummary(): Promise<{
        top_editors: any[];
        recent_activity: (import("mongoose").Document<unknown, {}, import("../../../models/audit-log.model").IAuditLog, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/audit-log.model").IAuditLog & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
    }>;
}
