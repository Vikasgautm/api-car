"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarVariantController = void 0;
const errorMessages_1 = require("../../../constants/errorMessages");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const audit_util_1 = require("../../../shared/utils/audit.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const create_variant_dto_1 = require("../dto/create-variant.dto");
const update_variant_dto_1 = require("../dto/update-variant.dto");
const car_variant_service_1 = require("../services/car-variant.service");
const variant_lifecycle_service_1 = require("../../variants/services/variant-lifecycle.service");
const difference_engine_service_1 = require("../../variants/services/difference-engine.service");
const model_aggregation_service_1 = require("../services/model-aggregation.service");
const variant_validation_service_1 = require("../../variants/services/variant-validation.service");
const variant_completeness_service_1 = require("../../variants/services/variant-completeness.service");
const variant_bulk_service_1 = require("../../variants/services/variant-bulk.service");
const spec_refinement_service_1 = require("../../variants/services/spec-refinement.service");
const variant_integrity_service_1 = require("../../variants/services/variant-integrity.service");
const variant_response_transformer_1 = require("../../../shared/transformers/variant-response.transformer");
class CarVariantController {
    // Public routes
    static getAllPublicVariants = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const filterDto = {
            ...req.query,
            is_published: true,
        };
        const result = await car_variant_service_1.CarVariantService.getAllVariants(filterDto, false);
        const filteredVariants = result.variants.map((variant) => {
            let filteredSpecs = car_variant_service_1.CarVariantService.removeHiddenSpecKeys(variant.specs_normalized, variant.hidden_spec_keys);
            filteredSpecs = car_variant_service_1.CarVariantService.removeHiddenSections(filteredSpecs, variant.hidden_sections);
            filteredSpecs = car_variant_service_1.CarVariantService.applyFuelTypeFilter(filteredSpecs, variant.fuel_type_id || '');
            filteredSpecs = car_variant_service_1.CarVariantService.removeEmptyValues(filteredSpecs);
            filteredSpecs = car_variant_service_1.CarVariantService.autoHideEmptySections(filteredSpecs);
            return {
                ...variant,
                specs_normalized: filteredSpecs,
            };
        });
        return response_util_1.ResponseUtil.paginated(res, filteredVariants, result.pagination, 'Variants retrieved successfully');
    });
    static getPublicVariantBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.getVariantBySlug(req.params.slug);
        if (!variant) {
            throw new app_error_util_1.AppError(`Variant not found for slug: ${req.params.slug}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.VARIANT_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.VARIANT_NOT_FOUND,
                details: {
                    field: 'slug',
                    reason: 'The variant does not exist or has been deleted.',
                },
            });
        }
        let filteredSpecs = car_variant_service_1.CarVariantService.removeHiddenSpecKeys(variant.specs_normalized, variant.hidden_spec_keys);
        filteredSpecs = car_variant_service_1.CarVariantService.removeHiddenSections(filteredSpecs, variant.hidden_sections);
        filteredSpecs = car_variant_service_1.CarVariantService.applyFuelTypeFilter(filteredSpecs, variant.fuel_type_id || '');
        filteredSpecs = car_variant_service_1.CarVariantService.removeEmptyValues(filteredSpecs);
        filteredSpecs = car_variant_service_1.CarVariantService.autoHideEmptySections(filteredSpecs);
        const filteredVariant = {
            ...variant,
            specs_normalized: filteredSpecs,
        };
        return response_util_1.ResponseUtil.success(res, filteredVariant, 'Variant retrieved successfully');
    });
    // Admin routes
    static getAllAdminVariants = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const includeDeleted = req.query.include_deleted === 'true';
        const result = await car_variant_service_1.CarVariantService.getAllVariants(req.query, includeDeleted);
        // Transform variants to display-ready format with flattened car metadata
        const transformedVariants = await variant_response_transformer_1.VariantResponseTransformer.transformBatch(result.variants);
        variant_response_transformer_1.VariantResponseTransformer.clearCache();
        return response_util_1.ResponseUtil.paginated(res, transformedVariants, result.pagination, 'Variants retrieved successfully');
    });
    static getAdminVariantById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.getVariantById(req.params.id);
        if (!variant) {
            throw new app_error_util_1.AppError(`Variant not found for variant_id: ${req.params.id}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.VARIANT_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.VARIANT_NOT_FOUND,
                details: {
                    field: 'variant_id',
                    reason: 'The variant does not exist or has been deleted.',
                },
            });
        }
        return response_util_1.ResponseUtil.success(res, variant, 'Variant retrieved successfully');
    });
    static createVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const createDto = {
            car_id: req.body.car_id,
            variant_name: req.body.variant_name,
            model_year: req.body.model_year,
            fuel_type_id: req.body.fuel_type_id,
            transmission_type: req.body.transmission_type,
            drivetrain: req.body.drivetrain,
            seating_capacity: req.body.seating_capacity,
            body_type: req.body.body_type,
            ex_showroom_price: req.body.ex_showroom_price,
            expected_price: req.body.expected_price,
            expected_launch_date: req.body.expected_launch_date,
            specs_normalized: req.body.specs_normalized,
            hidden_spec_keys: req.body.hidden_spec_keys,
            hidden_sections: req.body.hidden_sections,
            is_published: req.body.is_published,
        };
        const validation = create_variant_dto_1.CreateVariantDto.validate(createDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
        }
        const variant = await car_variant_service_1.CarVariantService.createVariant(createDto, audit_util_1.AuditUtil.actorFromRequest(req));
        return response_util_1.ResponseUtil.created(res, variant, 'Variant created successfully');
    });
    static updateVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const updateDto = {
            car_id: req.body.car_id,
            variant_name: req.body.variant_name,
            model_year: req.body.model_year,
            fuel_type_id: req.body.fuel_type_id,
            transmission_type: req.body.transmission_type,
            drivetrain: req.body.drivetrain,
            seating_capacity: req.body.seating_capacity,
            body_type: req.body.body_type,
            ex_showroom_price: req.body.ex_showroom_price,
            expected_price: req.body.expected_price,
            expected_launch_date: req.body.expected_launch_date,
            specs_normalized: req.body.specs_normalized,
            hidden_spec_keys: req.body.hidden_spec_keys,
            hidden_sections: req.body.hidden_sections,
            is_published: req.body.is_published !== undefined ? req.body.is_published === 'true' || req.body.is_published === true : undefined,
            editor_user_id: req.body.editor_user_id,
            seo_owner_user_id: req.body.seo_owner_user_id,
            reviewer_user_id: req.body.reviewer_user_id,
        };
        const validation = update_variant_dto_1.UpdateVariantDto.validate(updateDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
        }
        const variant = await car_variant_service_1.CarVariantService.updateVariant(req.params.id, updateDto, audit_util_1.AuditUtil.actorFromRequest(req));
        return response_util_1.ResponseUtil.success(res, variant, 'Variant updated successfully');
    });
    static deleteVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.deleteVariant(req.params.id, audit_util_1.AuditUtil.actorFromRequest(req));
        return response_util_1.ResponseUtil.success(res, variant, 'Variant deleted successfully');
    });
    static restoreVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.restoreVariant(req.params.id, audit_util_1.AuditUtil.actorFromRequest(req));
        return response_util_1.ResponseUtil.success(res, variant, 'Variant restored successfully');
    });
    static togglePublish = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.togglePublish(req.params.id, audit_util_1.AuditUtil.actorFromRequest(req));
        return response_util_1.ResponseUtil.success(res, variant, 'Variant publish status toggled successfully');
    });
    static publishVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.publishVariant(req.params.id, audit_util_1.AuditUtil.actorFromRequest(req));
        return response_util_1.ResponseUtil.success(res, variant, 'Variant published successfully');
    });
    static unpublishVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.unpublishVariant(req.params.id, audit_util_1.AuditUtil.actorFromRequest(req));
        return response_util_1.ResponseUtil.success(res, variant, 'Variant unpublished successfully');
    });
    static archiveVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const actor = audit_util_1.AuditUtil.actorFromRequest(req);
        const variant = await car_variant_service_1.CarVariantService.archiveVariant(req.params.id, actor.user_id || undefined, actor);
        return response_util_1.ResponseUtil.success(res, variant, 'Variant archived successfully');
    });
    static unarchiveVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.unarchiveVariant(req.params.id, audit_util_1.AuditUtil.actorFromRequest(req));
        return response_util_1.ResponseUtil.success(res, variant, 'Variant unarchived successfully');
    });
    // Lifecycle & Visibility endpoints
    static updateVisibility = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { section_visibility, estimated_fields } = req.body;
        if (!section_visibility && !estimated_fields) {
            throw new app_error_util_1.AppError('section_visibility or estimated_fields is required', 400);
        }
        let variant = await car_variant_service_1.CarVariantService.getVariantById(req.params.id);
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        // Update section visibility in parallel instead of sequential
        if (section_visibility && Array.isArray(section_visibility)) {
            await Promise.all(section_visibility.map(sv => variant_lifecycle_service_1.VariantLifecycleService.setSectionVisibility(req.params.id, sv.section_key, sv.visibility, sv.hidden_fields)));
        }
        // Update estimated fields
        if (estimated_fields && Array.isArray(estimated_fields)) {
            await variant_lifecycle_service_1.VariantLifecycleService.markFieldsAsEstimated(req.params.id, estimated_fields);
        }
        variant = await car_variant_service_1.CarVariantService.getVariantById(req.params.id);
        return response_util_1.ResponseUtil.success(res, variant, 'Visibility updated successfully');
    });
    static unhideOnLaunch = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await variant_lifecycle_service_1.VariantLifecycleService.unhideAllSections(req.params.id);
        return response_util_1.ResponseUtil.success(res, variant, 'Variant sections unhidden for launch');
    });
    static getEstimationCompleteness = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const completeness = await variant_lifecycle_service_1.VariantLifecycleService.getEstimationCompleteness(req.params.id);
        return response_util_1.ResponseUtil.success(res, completeness, 'Estimation completeness retrieved');
    });
    // Difference engine endpoints
    static getVariantDifference = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const difference = await difference_engine_service_1.DifferenceEngineService.calculateVariantDifference(req.params.id);
        return response_util_1.ResponseUtil.success(res, difference, 'Variant differences calculated');
    });
    static getCarVariantDifferences = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const differences = await difference_engine_service_1.DifferenceEngineService.calculateCarVariantDifferences(req.params.carId);
        return response_util_1.ResponseUtil.success(res, differences, 'Variant differences for car calculated');
    });
    // Model aggregation endpoints
    static getModelAggregates = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const aggregates = await model_aggregation_service_1.ModelAggregationService.aggregateModelFromVariants(req.params.carId);
        return response_util_1.ResponseUtil.success(res, aggregates, 'Model aggregates retrieved');
    });
    // Validation endpoints
    static validateVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const validation = await variant_validation_service_1.VariantValidationService.validateVariant(req.params.id);
        return response_util_1.ResponseUtil.success(res, validation, 'Variant validation completed');
    });
    static validateCarVariants = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const validations = await variant_validation_service_1.VariantValidationService.validateCarVariants(req.params.carId);
        return response_util_1.ResponseUtil.success(res, validations, 'Car variants validation completed');
    });
    static bulkValidate = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { variant_ids } = req.body;
        if (!variant_ids || !Array.isArray(variant_ids)) {
            throw new app_error_util_1.AppError('variant_ids array is required', 400);
        }
        const validations = await variant_bulk_service_1.VariantBulkService.bulkValidate(variant_ids);
        return response_util_1.ResponseUtil.success(res, validations, 'Bulk validation completed');
    });
    // Completeness endpoints
    static getVariantCompleteness = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const completeness = await variant_completeness_service_1.VariantCompletenessService.getVariantCompleteness(req.params.id);
        return response_util_1.ResponseUtil.success(res, completeness, 'Variant completeness retrieved');
    });
    static getCarCompleteness = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const report = await variant_completeness_service_1.VariantCompletenessService.getCarCompleteness(req.params.carId);
        return response_util_1.ResponseUtil.success(res, report, 'Car completeness report retrieved');
    });
    // Bulk operations endpoints
    static bulkUpdateStatus = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { variant_ids, status } = req.body;
        if (!variant_ids || !Array.isArray(variant_ids) || !status) {
            throw new app_error_util_1.AppError('variant_ids array and status are required', 400);
        }
        const changedBy = req.user?.email || 'system';
        const result = await variant_bulk_service_1.VariantBulkService.bulkUpdateStatus(variant_ids, status, changedBy);
        return response_util_1.ResponseUtil.success(res, result, 'Bulk status update completed');
    });
    static bulkPublish = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { variant_ids, should_publish } = req.body;
        if (!variant_ids || !Array.isArray(variant_ids) || should_publish === undefined) {
            throw new app_error_util_1.AppError('variant_ids array and should_publish are required', 400);
        }
        const changedBy = req.user?.email || 'system';
        const result = await variant_bulk_service_1.VariantBulkService.bulkPublish(variant_ids, should_publish, changedBy);
        return response_util_1.ResponseUtil.success(res, result, 'Bulk publish update completed');
    });
    static bulkUpdateVisibility = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { variant_ids, hidden_sections } = req.body;
        if (!variant_ids || !Array.isArray(variant_ids) || !hidden_sections) {
            throw new app_error_util_1.AppError('variant_ids array and hidden_sections are required', 400);
        }
        const changedBy = req.user?.email || 'system';
        const result = await variant_bulk_service_1.VariantBulkService.bulkUpdateVisibility(variant_ids, hidden_sections, changedBy);
        return response_util_1.ResponseUtil.success(res, result, 'Bulk visibility update completed');
    });
    static bulkUpdate = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { variant_ids, updates } = req.body;
        if (!variant_ids || !Array.isArray(variant_ids) || !updates) {
            throw new app_error_util_1.AppError('variant_ids array and updates are required', 400);
        }
        const changedBy = req.user?.email || 'system';
        const result = await variant_bulk_service_1.VariantBulkService.bulkUpdate({ variant_ids, updates }, changedBy);
        return response_util_1.ResponseUtil.success(res, result, 'Bulk update completed');
    });
    static bulkExportCsv = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { variant_ids } = req.body;
        if (!variant_ids || !Array.isArray(variant_ids)) {
            throw new app_error_util_1.AppError('variant_ids array is required', 400);
        }
        const csv = await variant_bulk_service_1.VariantBulkService.bulkExportCsv(variant_ids);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="variants.csv"');
        return res.send(csv);
    });
    // Spec refinement endpoints
    static refineVariantSpecs = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const refinement = await spec_refinement_service_1.SpecRefinementService.refineVariantSpecs(req.params.id);
        return response_util_1.ResponseUtil.success(res, refinement, 'Spec refinement suggestions generated');
    });
    static applyRefinementSuggestions = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { suggestions } = req.body;
        if (!suggestions || !Array.isArray(suggestions)) {
            throw new app_error_util_1.AppError('suggestions array is required', 400);
        }
        const updated = await spec_refinement_service_1.SpecRefinementService.applyRefinementSuggestions(req.params.id, suggestions);
        return response_util_1.ResponseUtil.success(res, updated, 'Refinement suggestions applied');
    });
    static refineMultipleVariants = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { variant_ids } = req.body;
        if (!variant_ids || !Array.isArray(variant_ids)) {
            throw new app_error_util_1.AppError('variant_ids array is required', 400);
        }
        const results = await spec_refinement_service_1.SpecRefinementService.refineMultipleVariants(variant_ids);
        return response_util_1.ResponseUtil.success(res, results, 'Spec refinement for multiple variants completed');
    });
    // Change history endpoints (Batch 6 Feature 2)
    static getVariantChangeHistory = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { field, source, startDate, endDate, limit } = req.query;
        const history = await variant_integrity_service_1.VariantIntegrityService.getChangeHistory(req.params.id, {
            field: field,
            source: source,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
        return response_util_1.ResponseUtil.success(res, history, 'Change history retrieved');
    });
    static getVariantAuditTrail = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const auditTrail = await variant_integrity_service_1.VariantIntegrityService.getAuditTrail(req.params.id);
        return response_util_1.ResponseUtil.success(res, { audit_trail: auditTrail }, 'Audit trail retrieved');
    });
    // Validation endpoints (enhanced with Batch 6)
    static validateVariantFull = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const validation = await variant_validation_service_1.VariantValidationService.validateVariantFull(req.params.id);
        return response_util_1.ResponseUtil.success(res, validation, 'Full validation completed');
    });
    static validateAutomotiveConstraints = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.getVariantById(req.params.id);
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        const validation = variant_validation_service_1.VariantValidationService.validateAutomotiveConstraints(variant);
        return response_util_1.ResponseUtil.success(res, validation, 'Automotive constraint validation completed');
    });
    // Integrity endpoints (Batch 6 Feature 1)
    static getVariantIntegrityStatus = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const status = await variant_integrity_service_1.VariantIntegrityService.comprehensiveValidate(req.params.id);
        return response_util_1.ResponseUtil.success(res, status, 'Variant integrity status retrieved');
    });
}
exports.CarVariantController = CarVariantController;
//# sourceMappingURL=car-variant.controller.js.map