/**
 * Car Launch Status Normalization Utility
 * Handles normalization of car launch status fields and ensures consistency
 */
export interface CarLaunchStatusPayload {
    status?: 'upcoming' | 'launched' | 'discontinued';
    is_upcoming?: boolean;
    is_launched?: boolean;
    expected_exshowroom_price?: number | null;
    expected_launch_date?: string | Date | null;
    exshowroom_price?: number | null;
    launch_date?: string | Date | null;
    is_latest?: boolean;
    upcomming?: boolean;
    upcoming?: boolean;
}
export declare function normalizeCarLaunchStatus(payload: CarLaunchStatusPayload): CarLaunchStatusPayload;
export declare function shouldAutoLaunch(car: any): boolean;
export declare function getAutoLaunchUpdateData(): Partial<CarLaunchStatusPayload>;
//# sourceMappingURL=car-launch-status.util.d.ts.map