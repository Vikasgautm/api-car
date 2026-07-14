export interface PriorityItem {
    id: string;
    title: string;
    description: string;
    count: number;
    severity: 'critical' | 'warning' | 'info';
    redirect_link: string;
    action_label: string;
}
export interface DashboardPriorities {
    items: PriorityItem[];
    total_issues: number;
    critical_count: number;
    warning_count: number;
}
export declare class DashboardPriorityService {
    static getPriorities(): Promise<DashboardPriorities>;
}
