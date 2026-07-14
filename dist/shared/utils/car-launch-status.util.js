"use strict";
/**
 * Car Launch Status Normalization Utility
 * Handles normalization of car launch status fields and ensures consistency
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCarLaunchStatus = normalizeCarLaunchStatus;
exports.shouldAutoLaunch = shouldAutoLaunch;
exports.getAutoLaunchUpdateData = getAutoLaunchUpdateData;
function normalizeCarLaunchStatus(payload) {
    const normalized = { ...payload };
    // Handle old typo field 'upcomming' - migrate to is_upcoming
    if (normalized.upcomming !== undefined && normalized.is_upcoming === undefined) {
        normalized.is_upcoming = normalized.upcomming;
    }
    // Handle old field 'upcoming' - migrate to is_upcoming
    if (normalized.upcoming !== undefined && normalized.is_upcoming === undefined) {
        normalized.is_upcoming = normalized.upcoming;
    }
    // Determine is_upcoming from status if not set
    if (normalized.is_upcoming === undefined && normalized.status !== undefined) {
        normalized.is_upcoming = normalized.status === 'upcoming';
    }
    // Default is_upcoming to false if still undefined
    if (normalized.is_upcoming === undefined) {
        normalized.is_upcoming = false;
    }
    // Normalize status based on is_upcoming
    if (normalized.is_upcoming === true) {
        normalized.status = 'upcoming';
        normalized.is_launched = false;
    }
    else if (normalized.status === 'discontinued') {
        // If discontinued, ensure proper state
        normalized.is_upcoming = false;
        normalized.is_launched = false;
    }
    else {
        // Default to launched
        normalized.status = 'launched';
        normalized.is_launched = true;
    }
    // Validate status consistency
    if (normalized.status === 'upcoming' && normalized.is_upcoming === false) {
        normalized.is_upcoming = true;
    }
    if (normalized.status === 'launched' && normalized.is_upcoming === true) {
        normalized.is_upcoming = false;
        normalized.is_launched = true;
    }
    // Parse date strings to Date objects
    if (normalized.expected_launch_date && typeof normalized.expected_launch_date === 'string') {
        normalized.expected_launch_date = new Date(normalized.expected_launch_date);
    }
    if (normalized.launch_date && typeof normalized.launch_date === 'string') {
        normalized.launch_date = new Date(normalized.launch_date);
    }
    return normalized;
}
function shouldAutoLaunch(car) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (car.is_upcoming === true &&
        car.status === 'upcoming' &&
        car.expected_launch_date !== null &&
        car.expected_launch_date !== undefined &&
        new Date(car.expected_launch_date) <= today &&
        car.is_deleted === false);
}
function getAutoLaunchUpdateData() {
    const today = new Date();
    return {
        is_upcoming: false,
        is_launched: true,
        status: 'launched',
        is_latest: true,
        // launch_date will be set conditionally in the service
    };
}
