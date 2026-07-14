import { AuditActor } from '../../../shared/utils/audit.util';
export type EntityLifecycleState = 'upcoming' | 'launched' | 'facelift' | 'discontinued' | 'concept' | 'testing' | 'archived';
export interface EntityStatusHistoryEntry {
    previous_state?: EntityLifecycleState | null;
    state: EntityLifecycleState;
    changed_at: Date;
    changed_by: string;
    reason?: string;
}
export interface SEOHistoryEntry {
    field: string;
    old_value: any;
    new_value: any;
    timestamp: Date;
    changed_by: string;
}
export interface VariantHistoryEntry {
    variant_id: string;
    action: 'added' | 'removed' | 'visibility_changed' | 'specs_updated';
    timestamp: Date;
    changed_by: string;
    details?: Record<string, any>;
}
export declare const VALID_TRANSITIONS: Record<string, string[]>;
export declare const OTP_REQUIRED_TRANSITIONS: Set<string>;
export declare const BLOCKED_TRANSITIONS: Set<string>;
export declare class CarLifecycleService {
    /**
     * Transition a car to a new lifecycle state
     * Preserves car_id, slug, and URL permanence
     * Automatically updates visibility and specs based on state
     */
    static transitionState(carId: string, newState: EntityLifecycleState, actor: AuditActor, reason?: string): Promise<any>;
    /**
     * Auto-unhide categories and sections when car launches (transactional helper)
     */
    private static unHideCategoryOnLaunchTx;
    /**
     * Get lifecycle history for a car
     */
    static getHistory(carId: string): Promise<{
        car_id: any;
        name: any;
        current_state: any;
        entity_created_at: any;
        entity_launch_date: any;
        history: any[];
        total: number;
    }>;
    /**
     * Schedule a lifecycle state change for future execution
     */
    static scheduleStateChange(carId: string, newState: EntityLifecycleState, scheduledDate: Date, actor: AuditActor, reason?: string): Promise<{
        car_id: any;
        scheduled_state: EntityLifecycleState;
        scheduled_date: Date;
        created_by: string | null | undefined;
    }>;
    /**
     * Get all upcoming cars scheduled to launch
     */
    static getUpcomingLaunches(days?: number): Promise<any[]>;
    /**
     * Track SEO metadata changes for history
     */
    static recordSEOChange(carId: string, field: string, oldValue: any, newValue: any, actor: AuditActor): Promise<void>;
    /**
     * Track variant changes for history
     */
    static recordVariantChange(carId: string, variantId: string, action: 'added' | 'removed' | 'visibility_changed' | 'specs_updated', actor: AuditActor, details?: Record<string, any>): Promise<void>;
    /**
     * Get SEO continuity report for a car (rankings, metadata evolution)
     */
    static getSEOContinuityReport(carId: string): Promise<{
        car_id: any;
        name: any;
        slug: any;
        entity_lifecycle_state: any;
        canonical_url: any;
        url_permanence: {
            is_permanent: boolean;
            reason: string;
        };
        seo_metadata_evolution: any;
        status_history: any;
        variant_history: any;
        seo_health: {
            meta_title_present: boolean;
            meta_description_present: boolean;
            canonical_url_present: boolean;
            noindex: boolean;
        };
    }>;
}
