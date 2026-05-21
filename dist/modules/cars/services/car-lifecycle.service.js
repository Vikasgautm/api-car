"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarLifecycleService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const car_model_1 = require("../../../models/car.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const VALID_TRANSITIONS = {
    upcoming: ['launched'],
    launched: ['discontinued', 'facelift'],
    discontinued: ['archived'],
    facelift: ['discontinued'],
    archived: [],
};
class CarLifecycleService {
    /**
     * Transition a car to a new lifecycle state
     * Preserves car_id, slug, and URL permanence
     * Automatically updates visibility and specs based on state
     */
    static async transitionState(carId, newState, actor, reason) {
        const session = await mongoose_1.default.startSession();
        let savedCar;
        try {
            await session.withTransaction(async () => {
                const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false }).session(session);
                if (!car)
                    throw new app_error_util_1.AppError('Car not found', 404);
                const currentState = car.entity_lifecycle_state || 'launched';
                if (currentState === newState) {
                    throw new app_error_util_1.AppError(`Car is already in ${newState} state`, 400);
                }
                const allowed = VALID_TRANSITIONS[currentState] ?? [];
                if (!allowed.includes(newState)) {
                    throw new app_error_util_1.AppError(`Invalid transition: ${currentState} → ${newState}. Allowed: ${allowed.join(', ') || 'none'}`, 400);
                }
                const historyEntry = {
                    state: newState,
                    changed_at: new Date(),
                    changed_by: actor.user_id || 'system',
                    reason: reason || `Transitioned from ${currentState} to ${newState}`,
                };
                if (!car.entity_status_history)
                    car.entity_status_history = [];
                car.entity_status_history.push(historyEntry);
                car.entity_lifecycle_state = newState;
                if (newState === 'launched') {
                    car.entity_launch_date = new Date();
                    car.is_upcoming = false;
                    car.is_launched = true;
                    car.status = 'launched';
                }
                else if (newState === 'upcoming') {
                    car.is_upcoming = true;
                    car.is_launched = false;
                    car.status = 'upcoming';
                }
                else if (newState === 'discontinued') {
                    car.status = 'discontinued';
                    car.discontinued_at = new Date();
                    car.discontinued_by = actor.user_id || 'system';
                }
                else if (newState === 'facelift') {
                    car.is_facelift = true;
                    car.status = 'launched';
                }
                if (!car.entity_created_at) {
                    car.entity_created_at = car.createdAt || new Date();
                }
                await car.save({ session });
                if (newState === 'launched') {
                    await this.unHideCategoryOnLaunch(carId, session);
                }
                savedCar = car;
            });
        }
        finally {
            session.endSession();
        }
        return savedCar;
    }
    /**
     * Auto-unhide categories and sections when car launches
     */
    static async unHideCategoryOnLaunch(carId, session) {
        const variants = await car_variant_model_1.CarVariant.find({ car_id: carId, is_deleted: false }).session(session ?? null);
        const bulkOps = [];
        for (const variant of variants) {
            let modified = false;
            const updateData = {};
            if (variant.hidden_sections && variant.hidden_sections.length > 0) {
                // Clear hidden sections on launch
                updateData.hidden_sections = [];
                modified = true;
            }
            if (variant.section_visibility && variant.section_visibility.length > 0) {
                // Unhide teaser-only and partial sections
                const updatedVisibility = variant.section_visibility.map((section) => {
                    if (section.visibility === 'teaser_only' || section.visibility === 'partial') {
                        return { ...section, visibility: 'visible', hidden_fields: [] };
                    }
                    return section;
                });
                updateData.section_visibility = updatedVisibility;
                modified = true;
            }
            if (variant.field_visibility) {
                // Unhide teaser_only and partial fields
                const updatedFieldVisibility = { ...variant.field_visibility };
                for (const [fieldKey, visibility] of Object.entries(variant.field_visibility)) {
                    if (visibility === 'teaser_only' || visibility === 'partial') {
                        updatedFieldVisibility[fieldKey] = 'visible';
                        modified = true;
                    }
                }
                if (modified)
                    updateData.field_visibility = updatedFieldVisibility;
            }
            if (modified) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: variant._id },
                        update: { $set: updateData }
                    }
                });
            }
        }
        if (bulkOps.length > 0) {
            await car_variant_model_1.CarVariant.bulkWrite(bulkOps, { session });
        }
    }
    /**
     * Get lifecycle history for a car
     */
    static async getHistory(carId) {
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false });
        if (!car) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        return {
            car_id: car.car_id,
            name: car.name,
            current_state: car.entity_lifecycle_state || 'launched',
            entity_created_at: car.entity_created_at,
            entity_launch_date: car.entity_launch_date,
            history: car.entity_status_history || [],
        };
    }
    /**
     * Schedule a lifecycle state change for future execution
     */
    static async scheduleStateChange(carId, newState, scheduledDate, actor, reason) {
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false });
        if (!car) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        // Store scheduled transition in a metadata field
        if (!car.entity_status_history) {
            car.entity_status_history = [];
        }
        const scheduledEntry = {
            state: newState,
            changed_at: scheduledDate,
            changed_by: actor.user_id || 'system',
            reason: `[SCHEDULED] ${reason || `Scheduled for ${newState}`}`,
        };
        car.entity_status_history.push(scheduledEntry);
        await car.save();
        return {
            car_id: car.car_id,
            scheduled_state: newState,
            scheduled_date: scheduledDate,
            created_by: actor.user_id,
        };
    }
    /**
     * Get all upcoming cars scheduled to launch
     */
    static async getUpcomingLaunches(days = 30) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        return await car_model_1.Car.find({
            is_deleted: false,
            entity_lifecycle_state: 'upcoming',
            entity_launch_date: {
                $gte: new Date(),
                $lte: futureDate,
            },
        })
            .select('car_id name brand_id entity_launch_date')
            .sort({ entity_launch_date: 1 });
    }
    /**
     * Track SEO metadata changes for history
     */
    static async recordSEOChange(carId, field, oldValue, newValue, actor) {
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false });
        if (!car) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        if (!car.seo_history) {
            car.seo_history = [];
        }
        car.seo_history.push({
            field,
            old_value: oldValue,
            new_value: newValue,
            timestamp: new Date(),
            changed_by: actor.user_id || 'system',
        });
        await car.save();
    }
    /**
     * Track variant changes for history
     */
    static async recordVariantChange(carId, variantId, action, actor, details) {
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false });
        if (!car) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        if (!car.variant_history) {
            car.variant_history = [];
        }
        car.variant_history.push({
            variant_id: variantId,
            action,
            timestamp: new Date(),
            changed_by: actor.user_id || 'system',
            details: details || {},
        });
        await car.save();
    }
    /**
     * Get SEO continuity report for a car (rankings, metadata evolution)
     */
    static async getSEOContinuityReport(carId) {
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false });
        if (!car) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        return {
            car_id: car.car_id,
            name: car.name,
            slug: car.slug, // Permanent and unchanging
            entity_lifecycle_state: car.entity_lifecycle_state || 'launched',
            canonical_url: car.canonical_url, // Permanent canonical
            url_permanence: {
                is_permanent: true,
                reason: 'URL structure remains unchanged through lifecycle transitions',
            },
            seo_metadata_evolution: car.seo_history || [],
            status_history: car.entity_status_history || [],
            variant_history: car.variant_history || [],
            seo_health: {
                meta_title_present: !!car.meta_title,
                meta_description_present: !!car.meta_description,
                canonical_url_present: !!car.canonical_url,
                noindex: car.noindex || false,
            },
        };
    }
}
exports.CarLifecycleService = CarLifecycleService;
//# sourceMappingURL=car-lifecycle.service.js.map