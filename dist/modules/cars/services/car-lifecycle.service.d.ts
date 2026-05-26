import mongoose from 'mongoose';
import { EntityLifecycleState, EntityStatusHistoryEntry } from '../../../models/car.model';
import { AuditActor } from '../../../shared/utils/audit.util';
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
     * Auto-unhide categories and sections when car launches
     */
    static unHideCategoryOnLaunch(carId: string, session?: mongoose.ClientSession): Promise<void>;
    /**
     * Get lifecycle history for a car
     */
    static getHistory(carId: string): Promise<{
        car_id: string;
        name: string;
        current_state: EntityLifecycleState;
        entity_created_at: Date | null | undefined;
        entity_launch_date: Date | null | undefined;
        history: EntityStatusHistoryEntry[];
        total: number;
    }>;
    /**
     * Schedule a lifecycle state change for future execution
     */
    static scheduleStateChange(carId: string, newState: EntityLifecycleState, scheduledDate: Date, actor: AuditActor, reason?: string): Promise<{
        car_id: string;
        scheduled_state: EntityLifecycleState;
        scheduled_date: Date;
        created_by: string | null | undefined;
    }>;
    /**
     * Get all upcoming cars scheduled to launch
     */
    static getUpcomingLaunches(days?: number): Promise<(mongoose.Document<unknown, {}, import("../../../models/car.model").ICar, {}, mongoose.DefaultSchemaOptions> & import("../../../models/car.model").ICar & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
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
        car_id: string;
        name: string;
        slug: string;
        entity_lifecycle_state: EntityLifecycleState;
        canonical_url: string | undefined;
        url_permanence: {
            is_permanent: boolean;
            reason: string;
        };
        seo_metadata_evolution: import("../../../models/car.model").SEOHistoryEntry[];
        status_history: EntityStatusHistoryEntry[];
        variant_history: import("../../../models/car.model").VariantHistoryEntry[];
        seo_health: {
            meta_title_present: boolean;
            meta_description_present: boolean;
            canonical_url_present: boolean;
            noindex: boolean;
        };
    }>;
}
//# sourceMappingURL=car-lifecycle.service.d.ts.map