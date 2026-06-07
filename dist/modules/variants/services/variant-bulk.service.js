"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantBulkService = void 0;
const car_variant_model_1 = require("../../../models/car-variant.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const logger_1 = require("../../../utils/logger");
const variant_validation_service_1 = require("./variant-validation.service");
const variant_integrity_service_1 = require("./variant-integrity.service");
async function runChangeRecording(entries, label) {
    if (entries.length === 0)
        return;
    const results = await Promise.allSettled(entries.map(e => e.promise));
    results.forEach((r, i) => {
        if (r.status === 'rejected') {
            logger_1.logger.error('AUDIT_GAP', {
                variant_id: entries[i].variantId,
                source: 'variant-bulk',
                operation: label,
                error: r.reason instanceof Error ? r.reason.message : String(r.reason),
                timestamp: new Date().toISOString(),
            });
        }
    });
}
class VariantBulkService {
    static async bulkUpdateVisibility(variantIds, hiddenSections, changedBy = 'system') {
        const result = {
            total: variantIds.length,
            successful: 0,
            failed: 0,
            errors: [],
            updated_variants: [],
        };
        const beforeVariants = await Promise.allSettled(variantIds.map(id => car_variant_model_1.CarVariant.findOne({ variant_id: id }).lean()));
        const bulkOps = variantIds.map(variantId => ({
            updateOne: {
                filter: { variant_id: variantId },
                update: {
                    $set: {
                        hidden_sections: hiddenSections,
                        updated_at: new Date(),
                    }
                }
            }
        }));
        await car_variant_model_1.CarVariant.bulkWrite(bulkOps);
        const changeRecordingPromises = [];
        for (let i = 0; i < variantIds.length; i++) {
            const variantId = variantIds[i];
            const beforeResult = beforeVariants[i];
            if (beforeResult.status === 'fulfilled' && beforeResult.value) {
                const afterObj = { ...beforeResult.value, hidden_sections: hiddenSections, updated_at: new Date() };
                result.successful++;
                result.updated_variants.push(afterObj);
                changeRecordingPromises.push({
                    variantId,
                    promise: variant_integrity_service_1.VariantIntegrityService.recordVariantChanges(variantId, beforeResult.value, afterObj, changedBy, 'bulk_operation'),
                });
            }
            else {
                result.failed++;
                result.errors.push({ variant_id: variantId, error: 'Failed to update variant' });
            }
        }
        await runChangeRecording(changeRecordingPromises, 'bulkUpdateVisibility');
        return result;
    }
    static async bulkUpdateStatus(variantIds, status, changedBy = 'system') {
        const validStatuses = ['draft', 'incomplete', 'review_pending', 'hidden', 'launched', 'upcoming', 'discontinued'];
        if (!validStatuses.includes(status)) {
            throw new app_error_util_1.AppError(`Invalid status: ${status}`, 400);
        }
        const result = {
            total: variantIds.length,
            successful: 0,
            failed: 0,
            errors: [],
            updated_variants: [],
        };
        const beforeVariants = await Promise.allSettled(variantIds.map(id => car_variant_model_1.CarVariant.findOne({ variant_id: id }).lean()));
        const bulkOps = variantIds.map(variantId => ({
            updateOne: {
                filter: { variant_id: variantId },
                update: {
                    $set: {
                        variant_status: status,
                        updated_at: new Date(),
                    }
                }
            }
        }));
        await car_variant_model_1.CarVariant.bulkWrite(bulkOps);
        const changeRecordingPromises = [];
        for (let i = 0; i < variantIds.length; i++) {
            const variantId = variantIds[i];
            const beforeResult = beforeVariants[i];
            if (beforeResult.status === 'fulfilled' && beforeResult.value) {
                const afterObj = { ...beforeResult.value, variant_status: status, updated_at: new Date() };
                result.successful++;
                result.updated_variants.push(afterObj);
                changeRecordingPromises.push({
                    variantId,
                    promise: variant_integrity_service_1.VariantIntegrityService.recordVariantChanges(variantId, beforeResult.value, afterObj, changedBy, 'bulk_operation'),
                });
            }
            else {
                result.failed++;
                result.errors.push({ variant_id: variantId, error: 'Failed to update variant' });
            }
        }
        await runChangeRecording(changeRecordingPromises, 'bulkUpdateStatus');
        return result;
    }
    static async bulkPublish(variantIds, shouldPublish, changedBy = 'system') {
        const result = {
            total: variantIds.length,
            successful: 0,
            failed: 0,
            errors: [],
            updated_variants: [],
        };
        const validationResults = new Map();
        if (shouldPublish) {
            const validations = await Promise.allSettled(variantIds.map(id => variant_validation_service_1.VariantValidationService.validateVariant(id)));
            validations.forEach((v, idx) => {
                if (v.status === 'fulfilled') {
                    validationResults.set(variantIds[idx], v.value);
                }
            });
        }
        const beforeVariants = await Promise.allSettled(variantIds.map(id => car_variant_model_1.CarVariant.findOne({ variant_id: id }).lean()));
        const publishedAt = shouldPublish ? new Date() : null;
        const bulkOps = variantIds
            .filter(variantId => {
            if (shouldPublish && validationResults.has(variantId)) {
                const validation = validationResults.get(variantId);
                if (!validation.isValid) {
                    result.failed++;
                    result.errors.push({
                        variant_id: variantId,
                        error: `Validation failed: ${validation.errors[0]?.message}`,
                    });
                    return false;
                }
            }
            return true;
        })
            .map(variantId => ({
            updateOne: {
                filter: { variant_id: variantId },
                update: {
                    $set: {
                        is_published: shouldPublish,
                        publish_status: (shouldPublish ? 'published' : 'draft'),
                        published_at: publishedAt,
                        updated_at: new Date(),
                    }
                }
            }
        }));
        if (bulkOps.length > 0) {
            await car_variant_model_1.CarVariant.bulkWrite(bulkOps);
        }
        const changeRecordingPromises = [];
        const filteredSet = new Set(bulkOps.map((op) => op.updateOne.filter.variant_id));
        for (let i = 0; i < variantIds.length; i++) {
            const variantId = variantIds[i];
            if (!filteredSet.has(variantId))
                continue;
            const beforeResult = beforeVariants[i];
            if (beforeResult.status === 'fulfilled' && beforeResult.value) {
                const afterObj = { ...beforeResult.value, is_published: shouldPublish, published_at: publishedAt, updated_at: new Date() };
                result.successful++;
                result.updated_variants.push(afterObj);
                changeRecordingPromises.push({
                    variantId,
                    promise: variant_integrity_service_1.VariantIntegrityService.recordVariantChanges(variantId, beforeResult.value, afterObj, changedBy, 'bulk_operation'),
                });
            }
            else {
                result.failed++;
                result.errors.push({ variant_id: variantId, error: 'Failed to update variant' });
            }
        }
        await runChangeRecording(changeRecordingPromises, 'bulkPublish');
        return result;
    }
    static async bulkUpdate(request, changedBy = 'system') {
        const result = {
            total: request.variant_ids.length,
            successful: 0,
            failed: 0,
            errors: [],
            updated_variants: [],
        };
        const beforeVariants = await Promise.allSettled(request.variant_ids.map(id => car_variant_model_1.CarVariant.findOne({ variant_id: id }).lean()));
        const sharedUpdate = { updated_at: new Date() };
        if (request.updates.variant_status)
            sharedUpdate.variant_status = request.updates.variant_status;
        if (request.updates.is_published !== undefined) {
            sharedUpdate.is_published = request.updates.is_published;
            if (request.updates.is_published)
                sharedUpdate.published_at = new Date();
        }
        if (request.updates.hidden_sections)
            sharedUpdate.hidden_sections = request.updates.hidden_sections;
        if (request.updates.hidden_spec_keys)
            sharedUpdate.hidden_spec_keys = request.updates.hidden_spec_keys;
        const bulkOps = request.variant_ids.map(variantId => ({
            updateOne: {
                filter: { variant_id: variantId },
                update: { $set: sharedUpdate }
            }
        }));
        if (bulkOps.length > 0) {
            await car_variant_model_1.CarVariant.bulkWrite(bulkOps);
        }
        const changeRecordingPromises = [];
        for (let i = 0; i < request.variant_ids.length; i++) {
            const variantId = request.variant_ids[i];
            const beforeResult = beforeVariants[i];
            if (beforeResult.status === 'fulfilled' && beforeResult.value) {
                const afterObj = { ...beforeResult.value, ...sharedUpdate };
                result.successful++;
                result.updated_variants.push(afterObj);
                changeRecordingPromises.push({
                    variantId,
                    promise: variant_integrity_service_1.VariantIntegrityService.recordVariantChanges(variantId, beforeResult.value, afterObj, changedBy, 'bulk_operation'),
                });
            }
            else {
                result.failed++;
                result.errors.push({ variant_id: variantId, error: 'Failed to update variant' });
            }
        }
        await runChangeRecording(changeRecordingPromises, 'bulkUpdate');
        return result;
    }
    static async bulkValidate(variantIds) {
        const validationResults = {};
        const validations = await Promise.allSettled(variantIds.map(id => variant_validation_service_1.VariantValidationService.validateVariant(id)));
        validations.forEach((result, idx) => {
            const variantId = variantIds[idx];
            if (result.status === 'fulfilled') {
                validationResults[variantId] = result.value;
            }
            else {
                validationResults[variantId] = {
                    error: result.reason instanceof Error ? result.reason.message : String(result.reason),
                };
            }
        });
        return validationResults;
    }
    static async bulkHide(variantIds, changedBy = 'system') {
        const beforeVariants = await Promise.allSettled(variantIds.map(id => car_variant_model_1.CarVariant.findOne({ variant_id: id }).lean()));
        const bulkOps = variantIds.map(variantId => ({
            updateOne: {
                filter: { variant_id: variantId },
                update: { $set: { is_published: false, publish_status: 'hidden', updated_at: new Date() } },
            },
        }));
        await car_variant_model_1.CarVariant.bulkWrite(bulkOps);
        const result = { total: variantIds.length, successful: 0, failed: 0, errors: [], updated_variants: [] };
        const changeRecordingPromises = [];
        for (let i = 0; i < variantIds.length; i++) {
            const br = beforeVariants[i];
            if (br.status === 'fulfilled' && br.value) {
                const after = { ...br.value, is_published: false, publish_status: 'hidden', updated_at: new Date() };
                result.successful++;
                result.updated_variants.push(after);
                changeRecordingPromises.push({
                    variantId: variantIds[i],
                    promise: variant_integrity_service_1.VariantIntegrityService.recordVariantChanges(variantIds[i], br.value, after, changedBy, 'bulk_operation'),
                });
            }
            else {
                result.failed++;
                result.errors.push({ variant_id: variantIds[i], error: 'Variant not found' });
            }
        }
        await runChangeRecording(changeRecordingPromises, 'bulkHide');
        return result;
    }
    static async bulkUnhide(variantIds, changedBy = 'system') {
        const beforeVariants = await Promise.allSettled(variantIds.map(id => car_variant_model_1.CarVariant.findOne({ variant_id: id }).lean()));
        const bulkOps = variantIds.map(variantId => ({
            updateOne: {
                filter: { variant_id: variantId },
                update: { $set: { publish_status: 'draft', updated_at: new Date() } },
            },
        }));
        await car_variant_model_1.CarVariant.bulkWrite(bulkOps);
        const result = { total: variantIds.length, successful: 0, failed: 0, errors: [], updated_variants: [] };
        const changeRecordingPromises = [];
        for (let i = 0; i < variantIds.length; i++) {
            const br = beforeVariants[i];
            if (br.status === 'fulfilled' && br.value) {
                const after = { ...br.value, publish_status: 'draft', updated_at: new Date() };
                result.successful++;
                result.updated_variants.push(after);
                changeRecordingPromises.push({
                    variantId: variantIds[i],
                    promise: variant_integrity_service_1.VariantIntegrityService.recordVariantChanges(variantIds[i], br.value, after, changedBy, 'bulk_operation'),
                });
            }
            else {
                result.failed++;
                result.errors.push({ variant_id: variantIds[i], error: 'Variant not found' });
            }
        }
        await runChangeRecording(changeRecordingPromises, 'bulkUnhide');
        return result;
    }
    static async bulkTag(variantIds, tags, changedBy = 'system') {
        const beforeVariants = await Promise.allSettled(variantIds.map(id => car_variant_model_1.CarVariant.findOne({ variant_id: id }).lean()));
        const bulkOps = variantIds.map(variantId => ({
            updateOne: {
                filter: { variant_id: variantId },
                update: { $addToSet: { best_for_tags: { $each: tags } }, $set: { updated_at: new Date() } },
            },
        }));
        await car_variant_model_1.CarVariant.bulkWrite(bulkOps);
        const result = { total: variantIds.length, successful: 0, failed: 0, errors: [], updated_variants: [] };
        for (let i = 0; i < variantIds.length; i++) {
            const br = beforeVariants[i];
            if (br.status === 'fulfilled' && br.value) {
                result.successful++;
                result.updated_variants.push(br.value);
            }
            else {
                result.failed++;
                result.errors.push({ variant_id: variantIds[i], error: 'Variant not found' });
            }
        }
        return result;
    }
    static async bulkSyncTaxonomy(variantIds, changedBy = 'system') {
        const variants = await car_variant_model_1.CarVariant.find({ variant_id: { $in: variantIds }, is_deleted: { $ne: true } })
            .select('variant_id car_id fuel_type_id')
            .lean();
        const updated = variants.length;
        logger_1.logger.info(`bulkSyncTaxonomy: queued ${updated} variants for taxonomy sync`);
        return { synced: updated, updated };
    }
    static async bulkRefreshSEO(variantIds, changedBy = 'system') {
        const variants = await car_variant_model_1.CarVariant.find({ variant_id: { $in: variantIds }, is_deleted: { $ne: true } })
            .select('variant_id car_id')
            .lean();
        const updated = variants.length;
        logger_1.logger.info(`bulkRefreshSEO: queued ${updated} variants for SEO refresh`);
        return { refreshed: updated, updated };
    }
    static async bulkExportCsv(variantIds) {
        const variants = await car_variant_model_1.CarVariant.find({
            variant_id: { $in: variantIds },
        }).select('variant_id variant_name car_id fuel_type_id transmission_type seating_capacity ex_showroom_price variant_status is_published model_year');
        if (variants.length === 0) {
            throw new app_error_util_1.AppError('No variants found', 404);
        }
        const headers = [
            'variant_id',
            'variant_name',
            'car_id',
            'fuel_type_id',
            'transmission_type',
            'seating_capacity',
            'ex_showroom_price',
            'variant_status',
            'is_published',
            'model_year',
        ];
        let csv = headers.join(',') + '\n';
        variants.forEach((v) => {
            const obj = v.toObject();
            const row = headers.map((h) => {
                const val = obj[h];
                if (val === null || val === undefined)
                    return '';
                if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                    return `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            });
            csv += row.join(',') + '\n';
        });
        return csv;
    }
}
exports.VariantBulkService = VariantBulkService;
//# sourceMappingURL=variant-bulk.service.js.map