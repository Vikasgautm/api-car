/**
 * Migration script for car launch status fields
 * Handles backward compatibility for old field names and values
 */
export declare function migrateCarLaunchStatus(): Promise<{
    updatedCount: number;
    skippedCount: number;
}>;
