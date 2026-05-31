"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledLaunchService = void 0;
const car_model_1 = require("../../models/car.model");
const car_variant_model_1 = require("../../models/car-variant.model");
const car_lifecycle_service_1 = require("../../modules/cars/services/car-lifecycle.service");
const variant_lifecycle_service_1 = require("../../modules/variants/services/variant-lifecycle.service");
const app_error_util_1 = require("../utils/app-error.util");
class ScheduledLaunchService {
    /**
     * Process all scheduled launches that are due
     * Called by cron job or background task
     */
    static async processScheduledLaunches() {
        const now = new Date();
        // Find all cars with scheduled transitions
        const cars = await car_model_1.Car.find({
            'entity_status_history': {
                $elemMatch: {
                    reason: { $regex: '^\\[SCHEDULED\\]' },
                    changed_at: { $lte: now },
                },
            },
            is_deleted: false,
        });
        const results = {
            processed: 0,
            succeeded: 0,
            failed: 0,
            errors: [],
        };
        // Parallelize state transitions instead of sequential processing
        const transitionPromises = cars.map(async (car) => {
            try {
                // Find the scheduled entry
                const scheduledEntry = car.entity_status_history?.find((h) => h.reason?.startsWith('[SCHEDULED]') && h.changed_at <= now);
                if (!scheduledEntry)
                    return { success: false, error: 'No scheduled entry found' };
                // Execute the transition
                await car_lifecycle_service_1.CarLifecycleService.transitionState(car.car_id, scheduledEntry.state, { user_id: 'system' }, `Auto-executed scheduled transition: ${scheduledEntry.reason}`);
                return { success: true };
            }
            catch (error) {
                return {
                    success: false,
                    error: `Failed to process car ${car.car_id}: ${error instanceof Error ? error.message : 'Unknown error'}`
                };
            }
        });
        const transitionResults = await Promise.all(transitionPromises);
        results.processed = transitionResults.length;
        results.succeeded = transitionResults.filter(r => r.success).length;
        results.failed = transitionResults.filter(r => !r.success).length;
        results.errors = transitionResults.filter(r => r.error).map(r => r.error);
        return results;
    }
    /**
     * Perform bulk category evolution when a car launches
     * Unhides all variant sections and enables SEO filters
     */
    static async performBulkCategoryEvolutionOnLaunch(carId) {
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false });
        if (!car) {
            throw app_error_util_1.AppError.carNotFound(carId);
        }
        const variants = await car_variant_model_1.CarVariant.find({ car_id: carId, is_deleted: false });
        const results = {
            total_variants: variants.length,
            unhidden: 0,
            enabled_seo_filters: 0,
            errors: [],
        };
        // Parallelize unhiding operations
        const unhidePromises = variants.map(variant => variant_lifecycle_service_1.VariantLifecycleService.unhideAllSections(variant.variant_id)
            .then(() => ({ success: true, variant_id: variant.variant_id }))
            .catch(error => ({
            success: false,
            variant_id: variant.variant_id,
            error: error instanceof Error ? error.message : 'Unknown'
        })));
        const unhideResults = await Promise.all(unhidePromises);
        results.unhidden = unhideResults.filter(r => r.success).length;
        results.errors.push(...unhideResults.filter(r => !r.success && 'error' in r).map((r) => `Failed to unhide variant ${r.variant_id}: ${r.error}`));
        // Bulk update market status for all variants instead of sequential saves
        const bulkOps = variants.map(variant => ({
            updateOne: {
                filter: { _id: variant._id },
                update: {
                    $set: {
                        market_status: 'available',
                        is_upcoming: false,
                    }
                }
            }
        }));
        if (bulkOps.length > 0) {
            try {
                await car_variant_model_1.CarVariant.bulkWrite(bulkOps);
            }
            catch (error) {
                results.errors.push(`Failed to update variant market status: ${error instanceof Error ? error.message : 'Unknown'}`);
            }
        }
        // Enable SEO filters on car
        const aggregatedFeatures = {
            sunroof_available: car.sunroof_available,
            adas_available: car.adas_available,
            ventilated_seats_available: car.ventilated_seats_available,
            camera_360_available: car.camera_360_available,
            connected_car_available: car.connected_car_available,
            wireless_charger_available: car.wireless_charger_available,
            air_purifier_available: car.air_purifier_available,
            panoramic_sunroof_available: car.panoramic_sunroof_available,
        };
        // All features that were previously only teaser are now visible in SEO
        results.enabled_seo_filters = Object.values(aggregatedFeatures).filter(Boolean).length;
        return results;
    }
    /**
     * Schedule a future state transition
     */
    static async scheduleLaunchTransition(carId, targetState, scheduledDate, reason) {
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false });
        if (!car) {
            throw app_error_util_1.AppError.carNotFound(carId);
        }
        if (scheduledDate <= new Date()) {
            throw app_error_util_1.AppError.badRequest('Scheduled date must be in the future', 'The scheduled launch date must be in the future.');
        }
        // Add to history as [SCHEDULED]
        if (!car.entity_status_history) {
            car.entity_status_history = [];
        }
        car.entity_status_history.push({
            state: targetState,
            changed_at: scheduledDate,
            changed_by: 'system',
            reason: `[SCHEDULED] ${reason || `Scheduled transition to ${targetState}`}`,
        });
        await car.save();
        return {
            carId,
            targetState,
            scheduledDate,
            reason,
        };
    }
    /**
     * Get all scheduled launches for a date range
     */
    static async getScheduledLaunchesInRange(startDate, endDate) {
        return await car_model_1.Car.find({
            'entity_status_history': {
                $elemMatch: {
                    reason: { $regex: '^\\[SCHEDULED\\]' },
                    changed_at: {
                        $gte: startDate,
                        $lte: endDate,
                    },
                },
            },
            is_deleted: false,
        })
            .select('car_id name entity_status_history')
            .sort({ 'entity_status_history.changed_at': 1 });
    }
    /**
     * Cancel a scheduled launch
     */
    static async cancelScheduledLaunch(carId, targetState) {
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false });
        if (!car) {
            throw app_error_util_1.AppError.carNotFound(carId);
        }
        if (!car.entity_status_history) {
            throw app_error_util_1.AppError.notFound('Scheduled launch');
        }
        // Remove scheduled entry
        car.entity_status_history = car.entity_status_history.filter((h) => !(h.reason?.startsWith('[SCHEDULED]') && h.state === targetState));
        await car.save();
        return { success: true, message: 'Scheduled launch cancelled' };
    }
    /**
     * Get upcoming launches in the next N days
     */
    static async getUpcomingLaunchesWindow(days = 30) {
        const today = new Date();
        const future = new Date();
        future.setDate(future.getDate() + days);
        const scheduled = await this.getScheduledLaunchesInRange(today, future);
        return scheduled.map((car) => {
            const scheduledEntry = car.entity_status_history?.find((h) => h.reason?.startsWith('[SCHEDULED]'));
            return {
                car_id: car.car_id,
                name: car.name,
                scheduled_date: scheduledEntry?.changed_at,
                target_state: scheduledEntry?.state,
                reason: scheduledEntry?.reason,
            };
        });
    }
}
exports.ScheduledLaunchService = ScheduledLaunchService;
//# sourceMappingURL=scheduled-launch.service.js.map