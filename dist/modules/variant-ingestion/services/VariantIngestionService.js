"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantIngestionService = void 0;
const mongoose_1 = require("mongoose");
const VariantImportStaging_1 = require("../models/VariantImportStaging");
const ImportSession_1 = require("../models/ImportSession");
const VariantImportValidator_1 = require("../validators/VariantImportValidator");
const SpecNormalizationService_1 = require("./SpecNormalizationService");
const VariantCompletenessCalculator_1 = require("../utils/VariantCompletenessCalculator");
const VariantGroupingService_1 = require("./VariantGroupingService");
const car_model_1 = require("../../../models/car.model");
const fuel_type_model_1 = require("../../../models/fuel-type.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const enum_standardizer_service_1 = require("../../imports/services/enum-standardizer.service");
class VariantIngestionService {
    static async createSession(input) {
        const session = new ImportSession_1.ImportSession({
            session_name: input.session_name,
            source_name: input.source_name || 'manual',
            total_variants: input.variants.length,
            imported_by: input.imported_by || 'admin',
            session_status: 'active',
        });
        await session.save();
        const staged = [];
        // Fetch fuel type names once for validation so new master data entries are recognised
        const fuelTypeDocs = await fuel_type_model_1.FuelType.find({ is_deleted: false }).select('name').lean();
        const validFuelTypeNames = fuelTypeDocs.map((f) => f.name);
        for (const v of input.variants) {
            const normalizedSpecs = SpecNormalizationService_1.SpecNormalizationService.normalizeSpecs(v.raw_specs || {});
            const price = SpecNormalizationService_1.SpecNormalizationService.normalizePrice(v.price);
            const fuelType = SpecNormalizationService_1.SpecNormalizationService.normalizeFuelType(v.fuel_type);
            // Resolve transmission against master data (cached after first variant).
            // Falls back to raw value if master data is unavailable.
            const transmissionResult = v.transmission
                ? await enum_standardizer_service_1.EnumStandardizerService.standardizeMasterField('transmission_type', 'transmission', v.transmission, String(session._id))
                : null;
            const transmission = transmissionResult?.standardized_value ?? v.transmission ?? undefined;
            const validationResults = VariantImportValidator_1.VariantImportValidator.validate({
                variant_name: v.variant_name,
                source_car_name: v.source_car_name,
                price,
                fuel_type: fuelType,
                transmission,
                raw_specs: v.raw_specs || {},
                normalized_specs: normalizedSpecs,
            }, validFuelTypeNames);
            const completeness = VariantCompletenessCalculator_1.VariantCompletenessCalculator.calculate({
                normalized_specs: normalizedSpecs,
                price,
                fuel_type: fuelType,
                transmission,
            });
            const hasErrors = VariantImportValidator_1.VariantImportValidator.hasErrors(validationResults);
            const staging = new VariantImportStaging_1.VariantImportStaging({
                source_car_name: v.source_car_name,
                normalized_car_name: VariantGroupingService_1.VariantGroupingService.normalizeName(v.source_car_name),
                variant_name: v.variant_name,
                price,
                fuel_type: fuelType,
                transmission,
                raw_specs: v.raw_specs || {},
                normalized_specs: normalizedSpecs,
                validation_results: validationResults,
                completeness_score: completeness.score,
                confidence_score: hasErrors ? 0.3 : validationResults.length === 0 ? 0.9 : 0.6,
                import_status: hasErrors ? 'validation_failed' : 'imported',
                import_session_id: session._id,
                imported_by: input.imported_by || 'admin',
            });
            await staging.save();
            staged.push(staging);
        }
        // Auto-group after staging
        const groupResult = await VariantGroupingService_1.VariantGroupingService.applyGrouping(String(session._id));
        return { session, staged_count: staged.length, groups: groupResult.groups };
    }
    static async previewStaging(variants) {
        const previews = [];
        const fuelTypeDocs = await fuel_type_model_1.FuelType.find({ is_deleted: false }).select('name').lean();
        const validFuelTypeNames = fuelTypeDocs.map((f) => f.name);
        for (const v of variants) {
            const normalizedSpecs = SpecNormalizationService_1.SpecNormalizationService.normalizeSpecs(v.raw_specs || {});
            const price = SpecNormalizationService_1.SpecNormalizationService.normalizePrice(v.price);
            const fuelType = SpecNormalizationService_1.SpecNormalizationService.normalizeFuelType(v.fuel_type);
            const transmissionResult = v.transmission
                ? await enum_standardizer_service_1.EnumStandardizerService.standardizeMasterField('transmission_type', 'transmission', v.transmission)
                : null;
            const transmission = transmissionResult?.standardized_value ?? v.transmission ?? undefined;
            const validationResults = VariantImportValidator_1.VariantImportValidator.validate({
                variant_name: v.variant_name,
                source_car_name: v.source_car_name,
                price,
                fuel_type: fuelType,
                transmission,
                raw_specs: v.raw_specs || {},
                normalized_specs: normalizedSpecs,
            }, validFuelTypeNames);
            const completeness = VariantCompletenessCalculator_1.VariantCompletenessCalculator.calculate({
                normalized_specs: normalizedSpecs,
                price,
                fuel_type: fuelType,
                transmission,
            });
            previews.push({
                source_car_name: v.source_car_name,
                variant_name: v.variant_name,
                price,
                fuel_type: fuelType,
                transmission,
                normalized_specs: normalizedSpecs,
                validation_results: validationResults,
                completeness_score: completeness.score,
                has_errors: VariantImportValidator_1.VariantImportValidator.hasErrors(validationResults),
            });
        }
        return previews;
    }
    static async getStagingList(filters = {}, page = 1, limit = 50) {
        const query = {};
        if (filters.session_id)
            query.import_session_id = new mongoose_1.Types.ObjectId(filters.session_id);
        if (filters.import_status)
            query.import_status = filters.import_status;
        if (filters.linked_car_id)
            query.linked_car_id = filters.linked_car_id;
        if (filters.fuel_type)
            query.fuel_type = new RegExp(filters.fuel_type, 'i');
        if (filters.transmission)
            query.transmission = new RegExp(filters.transmission, 'i');
        if (filters.source_car_name)
            query.source_car_name = new RegExp(filters.source_car_name, 'i');
        if (filters.variant_name)
            query.variant_name = new RegExp(filters.variant_name, 'i');
        if (filters.date_from || filters.date_to) {
            query.created_at = {};
            if (filters.date_from)
                query.created_at.$gte = new Date(filters.date_from);
            if (filters.date_to)
                query.created_at.$lte = new Date(filters.date_to);
        }
        const skip = (page - 1) * limit;
        const sortSpec = filters.session_id
            ? { price: 1, created_at: -1 }
            : { created_at: -1 };
        const [docs, total] = await Promise.all([
            VariantImportStaging_1.VariantImportStaging.find(query).sort(sortSpec).skip(skip).limit(limit),
            VariantImportStaging_1.VariantImportStaging.countDocuments(query),
        ]);
        return { docs, total, page, limit, pages: Math.ceil(total / limit) };
    }
    static async linkCar(stagingId, carId, linkedBy) {
        const car = await car_model_1.Car.findOne({ car_id: carId }).select('name car_id');
        if (!car)
            throw app_error_util_1.AppError.carNotFound(carId);
        await VariantImportStaging_1.VariantImportStaging.updateOne({ _id: new mongoose_1.Types.ObjectId(stagingId) }, {
            $set: {
                linked_car_id: carId,
                linked_car_name: car.name,
                import_status: 'linked',
                linked_by: linkedBy,
            },
        });
        const sessionUpdate = await VariantImportStaging_1.VariantImportStaging.findById(stagingId);
        if (sessionUpdate?.import_session_id) {
            const linkedCount = await VariantImportStaging_1.VariantImportStaging.countDocuments({
                import_session_id: sessionUpdate.import_session_id,
                linked_car_id: { $exists: true, $ne: null },
            });
            await ImportSession_1.ImportSession.updateOne({ _id: sessionUpdate.import_session_id }, { $set: { linked_variants: linkedCount } });
        }
        return { success: true };
    }
    static async bulkLinkCar(stagingIds, carId, linkedBy) {
        const car = await car_model_1.Car.findOne({ car_id: carId }).select('name car_id');
        if (!car)
            throw app_error_util_1.AppError.carNotFound(carId);
        await VariantImportStaging_1.VariantImportStaging.updateMany({ _id: { $in: stagingIds.map(id => new mongoose_1.Types.ObjectId(id)) } }, {
            $set: {
                linked_car_id: carId,
                linked_car_name: car.name,
                import_status: 'linked',
                linked_by: linkedBy,
            },
        });
        return { updated: stagingIds.length };
    }
    static async bulkValidate(stagingIds) {
        const docs = await VariantImportStaging_1.VariantImportStaging.find({ _id: { $in: stagingIds.map(id => new mongoose_1.Types.ObjectId(id)) } });
        const results = [];
        const fuelTypeDocs = await fuel_type_model_1.FuelType.find({ is_deleted: false }).select('name').lean();
        const validFuelTypeNames = fuelTypeDocs.map((f) => f.name);
        for (const doc of docs) {
            const issues = VariantImportValidator_1.VariantImportValidator.validate({
                variant_name: doc.variant_name,
                source_car_name: doc.source_car_name,
                price: doc.price,
                fuel_type: doc.fuel_type,
                transmission: doc.transmission,
                raw_specs: doc.raw_specs,
                normalized_specs: doc.normalized_specs,
            }, validFuelTypeNames);
            const hasErrors = VariantImportValidator_1.VariantImportValidator.hasErrors(issues);
            const completeness = VariantCompletenessCalculator_1.VariantCompletenessCalculator.calculate({
                normalized_specs: doc.normalized_specs,
                price: doc.price,
                fuel_type: doc.fuel_type,
                transmission: doc.transmission,
            });
            const newStatus = hasErrors ? 'validation_failed' : doc.linked_car_id ? 'linked' : 'grouped';
            await VariantImportStaging_1.VariantImportStaging.updateOne({ _id: doc._id }, {
                $set: {
                    validation_results: issues,
                    completeness_score: completeness.score,
                    import_status: newStatus,
                },
            });
            results.push({ id: String(doc._id), status: newStatus, issues: issues.length });
        }
        return results;
    }
    static async bulkUpdateStatus(stagingIds, status, userId) {
        const update = { import_status: status };
        if (status === 'reviewed')
            update.reviewed_by = userId;
        await VariantImportStaging_1.VariantImportStaging.updateMany({ _id: { $in: stagingIds.map(id => new mongoose_1.Types.ObjectId(id)) } }, { $set: update });
        return { updated: stagingIds.length };
    }
    static async rejectVariant(stagingId, reason, userId) {
        await VariantImportStaging_1.VariantImportStaging.updateOne({ _id: new mongoose_1.Types.ObjectId(stagingId) }, {
            $set: {
                import_status: 'rejected',
                rejection_reason: reason,
                reviewed_by: userId,
            },
        });
        return { success: true };
    }
    static async getSessions(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [docs, total] = await Promise.all([
            ImportSession_1.ImportSession.find().sort({ created_at: -1 }).skip(skip).limit(limit),
            ImportSession_1.ImportSession.countDocuments(),
        ]);
        return { docs, total, page, limit };
    }
    static async getSession(sessionId) {
        return ImportSession_1.ImportSession.findById(sessionId);
    }
    static async checkDuplicates(variants) {
        const results = [];
        for (const v of variants) {
            const existing = await VariantImportStaging_1.VariantImportStaging.find({
                source_car_name: new RegExp(v.source_car_name.trim(), 'i'),
                variant_name: new RegExp(v.variant_name.trim(), 'i'),
            }).select('_id import_status import_session_id');
            results.push({
                source_car_name: v.source_car_name,
                variant_name: v.variant_name,
                is_duplicate: existing.length > 0,
                existing_count: existing.length,
                existing_statuses: existing.map(e => e.import_status),
            });
        }
        return results;
    }
}
exports.VariantIngestionService = VariantIngestionService;
