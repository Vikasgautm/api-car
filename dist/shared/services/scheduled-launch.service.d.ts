import { EntityLifecycleState } from '../../models/car.model';
interface ScheduledTransition {
    carId: string;
    targetState: EntityLifecycleState;
    scheduledDate: Date;
    reason?: string;
}
export declare class ScheduledLaunchService {
    /**
     * Process all scheduled launches that are due
     * Called by cron job or background task
     */
    static processScheduledLaunches(): Promise<{
        processed: number;
        succeeded: number;
        failed: number;
        errors: string[];
    }>;
    /**
     * Perform bulk category evolution when a car launches
     * Unhides all variant sections and enables SEO filters
     */
    static performBulkCategoryEvolutionOnLaunch(carId: string): Promise<{
        total_variants: number;
        unhidden: number;
        enabled_seo_filters: number;
        errors: string[];
    }>;
    /**
     * Schedule a future state transition
     */
    static scheduleLaunchTransition(carId: string, targetState: EntityLifecycleState, scheduledDate: Date, reason?: string): Promise<ScheduledTransition>;
    /**
     * Get all scheduled launches for a date range
     */
    static getScheduledLaunchesInRange(startDate: Date, endDate: Date): Promise<(import("../../models/car.model").ICar & import("../../sql/common/BaseModel").SQLDocument)[]>;
    /**
     * Cancel a scheduled launch
     */
    static cancelScheduledLaunch(carId: string, targetState: EntityLifecycleState): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Get upcoming launches in the next N days
     */
    static getUpcomingLaunchesWindow(days?: number): Promise<{
        car_id: string;
        name: string;
        scheduled_date: Date | undefined;
        target_state: EntityLifecycleState | undefined;
        reason: string | undefined;
    }[]>;
}
export {};
