"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarLifecycleService = exports.BLOCKED_TRANSITIONS = exports.OTP_REQUIRED_TRANSITIONS = exports.VALID_TRANSITIONS = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const dbConnection_1 = require("../../../sql/utils/dbConnection");
exports.VALID_TRANSITIONS = {
    concept: ['testing'],
    testing: ['upcoming'],
    upcoming: ['launched'],
    launched: ['facelift', 'discontinued'],
    facelift: ['archived'],
    discontinued: ['archived'],
    archived: [],
};
// Transitions that require OTP verification even for super_admin
exports.OTP_REQUIRED_TRANSITIONS = new Set([
    'launched→discontinued',
    'facelift→archived',
    'discontinued→archived',
]);
// Transitions blocked by default — require explicit override by super_admin + OTP + reason
exports.BLOCKED_TRANSITIONS = new Set([
    'discontinued→launched', // Historical generation relaunch — dangerous
]);
class CarLifecycleService {
    /**
     * Transition a car to a new lifecycle state
     * Preserves car_id, slug, and URL permanence
     * Automatically updates visibility and specs based on state
     */
    static async transitionState(carId, newState, actor, reason) {
        const pool = await (0, dbConnection_1.getPool)();
        const transaction = new dbConnection_1.mssql.Transaction(pool);
        await transaction.begin();
        try {
            const carResult = await transaction.request()
                .input('cid', dbConnection_1.mssql.NVarChar, carId)
                .query('SELECT TOP 1 entity_lifecycle_state, entity_created_at, entity_status_history, createdAt FROM Cars WHERE car_id = @cid AND is_deleted = 0');
            if (carResult.recordset.length === 0)
                throw new app_error_util_1.AppError('Car not found', 404);
            const car = carResult.recordset[0];
            const currentState = car.entity_lifecycle_state || 'launched';
            if (currentState === newState) {
                throw new app_error_util_1.AppError(`Car is already in ${newState} state`, 400);
            }
            const allowed = exports.VALID_TRANSITIONS[currentState] ?? [];
            if (!allowed.includes(newState)) {
                throw new app_error_util_1.AppError(`Invalid transition: ${currentState} → ${newState}. Allowed: ${allowed.join(', ') || 'none'}`, 400);
            }
            // Build history entry with previous_state for full lineage tracing
            const historyEntry = {
                previous_state: currentState,
                state: newState,
                changed_at: new Date(),
                changed_by: actor.user_id || 'system',
                reason: reason || `Transitioned from ${currentState} to ${newState}`,
            };
            const entity_status_history = car.entity_status_history ? JSON.parse(car.entity_status_history) : [];
            entity_status_history.push(historyEntry);
            let entity_created_at = car.entity_created_at;
            if (!entity_created_at) {
                entity_created_at = car.createdAt || new Date();
            }
            let entity_launch_date = car.entity_launch_date;
            let is_upcoming = car.is_upcoming === 1 || car.is_upcoming === true;
            let is_launched = car.is_launched === 1 || car.is_launched === true;
            let status = car.status;
            let discontinued_at = car.discontinued_at;
            let discontinued_by = car.discontinued_by;
            let is_facelift = car.is_facelift === 1 || car.is_facelift === true;
            let archived_at = car.archived_at;
            let archived_by = car.archived_by;
            if (newState === 'launched') {
                entity_launch_date = new Date();
                is_upcoming = false;
                is_launched = true;
                status = 'launched';
            }
            else if (newState === 'upcoming') {
                is_upcoming = true;
                is_launched = false;
                status = 'upcoming';
            }
            else if (newState === 'discontinued') {
                status = 'discontinued';
                discontinued_at = new Date();
                discontinued_by = actor.user_id || 'system';
            }
            else if (newState === 'facelift') {
                is_facelift = true;
                status = 'launched';
            }
            else if (newState === 'archived') {
                status = 'archived';
                archived_at = new Date();
                archived_by = actor.user_id || 'system';
            }
            else if (newState === 'concept' || newState === 'testing') {
                status = 'upcoming';
            }
            await transaction.request()
                .input('cid', dbConnection_1.mssql.NVarChar, carId)
                .input('lifecycle', dbConnection_1.mssql.NVarChar, newState)
                .input('created', dbConnection_1.mssql.DateTime, entity_created_at)
                .input('launch', dbConnection_1.mssql.DateTime, entity_launch_date)
                .input('up', dbConnection_1.mssql.Bit, is_upcoming ? 1 : 0)
                .input('ln', dbConnection_1.mssql.Bit, is_launched ? 1 : 0)
                .input('st', dbConnection_1.mssql.NVarChar, status)
                .input('disc_at', dbConnection_1.mssql.DateTime, discontinued_at)
                .input('disc_by', dbConnection_1.mssql.NVarChar, discontinued_by)
                .input('face', dbConnection_1.mssql.Bit, is_facelift ? 1 : 0)
                .input('arch_at', dbConnection_1.mssql.DateTime, archived_at)
                .input('arch_by', dbConnection_1.mssql.NVarChar, archived_by)
                .input('history', dbConnection_1.mssql.NVarChar, JSON.stringify(entity_status_history))
                .query(`UPDATE Cars SET 
          entity_lifecycle_state = @lifecycle,
          entity_created_at = @created,
          entity_launch_date = @launch,
          is_upcoming = @up,
          is_launched = @ln,
          status = @st,
          discontinued_at = @disc_at,
          discontinued_by = @disc_by,
          is_facelift = @face,
          archived_at = @arch_at,
          archived_by = @arch_by,
          entity_status_history = @history,
          updatedAt = GETDATE()
          WHERE car_id = @cid AND is_deleted = 0`);
            if (newState === 'launched') {
                await this.unHideCategoryOnLaunchTx(carId, transaction);
            }
            await transaction.commit();
            const updatedResult = await pool.request()
                .input('cid', dbConnection_1.mssql.NVarChar, carId)
                .query('SELECT TOP 1 * FROM Cars WHERE car_id = @cid AND is_deleted = 0');
            const updatedRow = updatedResult.recordset[0];
            return {
                ...updatedRow,
                is_upcoming: updatedRow.is_upcoming === 1 || updatedRow.is_upcoming === true,
                is_launched: updatedRow.is_launched === 1 || updatedRow.is_launched === true,
                is_facelift: updatedRow.is_facelift === 1 || updatedRow.is_facelift === true,
                entity_status_history: updatedRow.entity_status_history ? JSON.parse(updatedRow.entity_status_history) : [],
            };
        }
        catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
    /**
     * Auto-unhide categories and sections when car launches (transactional helper)
     */
    static async unHideCategoryOnLaunchTx(carId, transaction) {
        const variantsResult = await transaction.request()
            .input('cid', dbConnection_1.mssql.NVarChar, carId)
            .query('SELECT variant_id, hidden_sections, section_visibility, field_visibility FROM CarVariants WHERE car_id = @cid AND is_deleted = 0');
        for (const variant of variantsResult.recordset) {
            let modified = false;
            const updateFields = [];
            const req = transaction.request().input('vid', dbConnection_1.mssql.NVarChar, variant.variant_id);
            const hidden_sections = variant.hidden_sections ? JSON.parse(variant.hidden_sections) : [];
            let newHiddenSections = hidden_sections;
            if (hidden_sections && hidden_sections.length > 0) {
                newHiddenSections = [];
                modified = true;
            }
            const section_visibility = variant.section_visibility ? JSON.parse(variant.section_visibility) : [];
            let newSectionVisibility = section_visibility;
            if (section_visibility && section_visibility.length > 0) {
                newSectionVisibility = section_visibility.map((section) => {
                    if (section.visibility === 'teaser_only' || section.visibility === 'partial') {
                        modified = true;
                        return { ...section, visibility: 'visible', hidden_fields: [] };
                    }
                    return section;
                });
            }
            const field_visibility = variant.field_visibility ? JSON.parse(variant.field_visibility) : {};
            let newFieldVisibility = field_visibility;
            if (field_visibility) {
                const updatedFieldVisibility = { ...field_visibility };
                for (const [fieldKey, visibility] of Object.entries(field_visibility)) {
                    if (visibility === 'teaser_only' || visibility === 'partial') {
                        updatedFieldVisibility[fieldKey] = 'visible';
                        modified = true;
                    }
                }
                if (modified) {
                    newFieldVisibility = updatedFieldVisibility;
                }
            }
            if (modified) {
                await req
                    .input('hidden', dbConnection_1.mssql.NVarChar, JSON.stringify(newHiddenSections))
                    .input('sec', dbConnection_1.mssql.NVarChar, JSON.stringify(newSectionVisibility))
                    .input('field', dbConnection_1.mssql.NVarChar, JSON.stringify(newFieldVisibility))
                    .query('UPDATE CarVariants SET hidden_sections = @hidden, section_visibility = @sec, field_visibility = @field, updatedAt = GETDATE() WHERE variant_id = @vid');
            }
        }
    }
    /**
     * Get lifecycle history for a car
     */
    static async getHistory(carId) {
        const pool = await (0, dbConnection_1.getPool)();
        const result = await pool.request()
            .input('cid', dbConnection_1.mssql.NVarChar, carId)
            .query('SELECT car_id, name, entity_lifecycle_state, entity_created_at, entity_launch_date, entity_status_history FROM Cars WHERE car_id = @cid AND is_deleted = 0');
        if (result.recordset.length === 0) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        const car = result.recordset[0];
        const allHistory = car.entity_status_history ? JSON.parse(car.entity_status_history) : [];
        const history = [...allHistory].reverse();
        return {
            car_id: car.car_id,
            name: car.name,
            current_state: car.entity_lifecycle_state || 'launched',
            entity_created_at: car.entity_created_at,
            entity_launch_date: car.entity_launch_date,
            history,
            total: history.length,
        };
    }
    /**
     * Schedule a lifecycle state change for future execution
     */
    static async scheduleStateChange(carId, newState, scheduledDate, actor, reason) {
        const pool = await (0, dbConnection_1.getPool)();
        const result = await pool.request()
            .input('cid', dbConnection_1.mssql.NVarChar, carId)
            .query('SELECT car_id, entity_status_history FROM Cars WHERE car_id = @cid AND is_deleted = 0');
        if (result.recordset.length === 0) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        const car = result.recordset[0];
        const history = car.entity_status_history ? JSON.parse(car.entity_status_history) : [];
        const scheduledEntry = {
            state: newState,
            changed_at: scheduledDate,
            changed_by: actor.user_id || 'system',
            reason: `[SCHEDULED] ${reason || `Scheduled for ${newState}`}`,
        };
        history.push(scheduledEntry);
        await pool.request()
            .input('cid', dbConnection_1.mssql.NVarChar, carId)
            .input('history', dbConnection_1.mssql.NVarChar, JSON.stringify(history))
            .query('UPDATE Cars SET entity_status_history = @history, updatedAt = GETDATE() WHERE car_id = @cid AND is_deleted = 0');
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
        const pool = await (0, dbConnection_1.getPool)();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        const result = await pool.request()
            .input('now', dbConnection_1.mssql.DateTime, new Date())
            .input('future', dbConnection_1.mssql.DateTime, futureDate)
            .query(`SELECT car_id, name, brand_id, entity_launch_date FROM Cars 
        WHERE is_deleted = 0 
        AND entity_lifecycle_state = 'upcoming' 
        AND entity_launch_date >= @now 
        AND entity_launch_date <= @future 
        ORDER BY entity_launch_date ASC`);
        return result.recordset;
    }
    /**
     * Track SEO metadata changes for history
     */
    static async recordSEOChange(carId, field, oldValue, newValue, actor) {
        const pool = await (0, dbConnection_1.getPool)();
        const result = await pool.request()
            .input('cid', dbConnection_1.mssql.NVarChar, carId)
            .query('SELECT seo_history FROM Cars WHERE car_id = @cid AND is_deleted = 0');
        if (result.recordset.length === 0) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        const seo_history = result.recordset[0].seo_history ? JSON.parse(result.recordset[0].seo_history) : [];
        seo_history.push({
            field,
            old_value: oldValue,
            new_value: newValue,
            timestamp: new Date(),
            changed_by: actor.user_id || 'system',
        });
        await pool.request()
            .input('cid', dbConnection_1.mssql.NVarChar, carId)
            .input('seo', dbConnection_1.mssql.NVarChar, JSON.stringify(seo_history))
            .query('UPDATE Cars SET seo_history = @seo, updatedAt = GETDATE() WHERE car_id = @cid AND is_deleted = 0');
    }
    /**
     * Track variant changes for history
     */
    static async recordVariantChange(carId, variantId, action, actor, details) {
        const pool = await (0, dbConnection_1.getPool)();
        const result = await pool.request()
            .input('cid', dbConnection_1.mssql.NVarChar, carId)
            .query('SELECT variant_history FROM Cars WHERE car_id = @cid AND is_deleted = 0');
        if (result.recordset.length === 0) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        const variant_history = result.recordset[0].variant_history ? JSON.parse(result.recordset[0].variant_history) : [];
        variant_history.push({
            variant_id: variantId,
            action,
            timestamp: new Date(),
            changed_by: actor.user_id || 'system',
            details: details || {},
        });
        await pool.request()
            .input('cid', dbConnection_1.mssql.NVarChar, carId)
            .input('var', dbConnection_1.mssql.NVarChar, JSON.stringify(variant_history))
            .query('UPDATE Cars SET variant_history = @var, updatedAt = GETDATE() WHERE car_id = @cid AND is_deleted = 0');
    }
    /**
     * Get SEO continuity report for a car (rankings, metadata evolution)
     */
    static async getSEOContinuityReport(carId) {
        const pool = await (0, dbConnection_1.getPool)();
        const result = await pool.request()
            .input('cid', dbConnection_1.mssql.NVarChar, carId)
            .query('SELECT car_id, name, slug, entity_lifecycle_state, canonical_url, noindex, meta_title, meta_description, seo_history, entity_status_history, variant_history FROM Cars WHERE car_id = @cid AND is_deleted = 0');
        if (result.recordset.length === 0) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        const car = result.recordset[0];
        return {
            car_id: car.car_id,
            name: car.name,
            slug: car.slug,
            entity_lifecycle_state: car.entity_lifecycle_state || 'launched',
            canonical_url: car.canonical_url,
            url_permanence: {
                is_permanent: true,
                reason: 'URL structure remains unchanged through lifecycle transitions',
            },
            seo_metadata_evolution: car.seo_history ? JSON.parse(car.seo_history) : [],
            status_history: car.entity_status_history ? JSON.parse(car.entity_status_history) : [],
            variant_history: car.variant_history ? JSON.parse(car.variant_history) : [],
            seo_health: {
                meta_title_present: !!car.meta_title,
                meta_description_present: !!car.meta_description,
                canonical_url_present: !!car.canonical_url,
                noindex: car.noindex === 1 || car.noindex === true,
            },
        };
    }
}
exports.CarLifecycleService = CarLifecycleService;
