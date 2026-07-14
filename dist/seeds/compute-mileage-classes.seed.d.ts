/**
 * Backfill mileage / EV-range classifications for any car or variant that doesn't
 * yet have one. Runs on every server start but only touches rows that look unclassified,
 * so it's effectively a no-op once the data is healthy.
 */
export declare const computeMileageClassesIfNeeded: () => Promise<void>;
