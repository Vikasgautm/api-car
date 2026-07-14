export interface ActivityItem {
    activity_id: string;
    title: string;
    entity_type: string;
    entity_id: string;
    entity_name: string | null;
    action: string;
    actor_email: string | null;
    timestamp: Date;
    redirect_link: string;
}
export interface DashboardRecentActivity {
    items: ActivityItem[];
}
export declare class DashboardActivityService {
    static getRecentActivity(limit?: number): Promise<DashboardRecentActivity>;
}
