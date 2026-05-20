import { Request, Response } from 'express';
import { ERROR_CODES, USER_MESSAGES } from '../../../constants/errorMessages';
import { AuthRequest } from '../../../types/auth';
import { AppError } from '../../../shared/utils/app-error.util';
import { AuditUtil } from '../../../shared/utils/audit.util';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { CreateVariantDto } from '../dto/create-variant.dto';
import { UpdateVariantDto } from '../dto/update-variant.dto';
import { CarVariantService } from '../services/car-variant.service';
import { VariantLifecycleService } from '../../variants/services/variant-lifecycle.service';
import { DifferenceEngineService } from '../../variants/services/difference-engine.service';
import { ModelAggregationService } from '../services/model-aggregation.service';
import { VariantValidationService } from '../../variants/services/variant-validation.service';
import { VariantCompletenessService } from '../../variants/services/variant-completeness.service';
import { VariantBulkService } from '../../variants/services/variant-bulk.service';
import { SpecRefinementService } from '../../variants/services/spec-refinement.service';
import { VariantIntegrityService } from '../../variants/services/variant-integrity.service';
import { VariantResponseTransformer } from '../../../shared/transformers/variant-response.transformer';

export class CarVariantController {
  // Public routes
  static getAllPublicVariants = catchAsync(async (req: Request, res: Response) => {
    const filterDto = {
      ...req.query,
      is_published: true,
    };
    const result = await CarVariantService.getAllVariants(filterDto, false);
    const filteredVariants = result.variants.map((variant: any) => {
      let filteredSpecs = CarVariantService.removeHiddenSpecKeys(variant.specs_normalized, variant.hidden_spec_keys);
      filteredSpecs = CarVariantService.removeHiddenSections(filteredSpecs, variant.hidden_sections);
      filteredSpecs = CarVariantService.applyFuelTypeFilter(filteredSpecs, variant.fuel_type_id || '');
      filteredSpecs = CarVariantService.removeEmptyValues(filteredSpecs);
      filteredSpecs = CarVariantService.autoHideEmptySections(filteredSpecs);
      return {
        ...variant,
        specs_normalized: filteredSpecs,
      };
    });
    return ResponseUtil.paginated(res, filteredVariants, result.pagination, 'Variants retrieved successfully');
  });

  static getPublicVariantBySlug = catchAsync(async (req: Request, res: Response) => {
    const variant = await CarVariantService.getVariantBySlug(req.params.slug as string);
    if (!variant) {
      throw new AppError(
        `Variant not found for slug: ${req.params.slug}`,
        404,
        {
          userMessage: USER_MESSAGES.VARIANT_NOT_FOUND,
          errorCode: ERROR_CODES.VARIANT_NOT_FOUND,
          details: {
            field: 'slug',
            reason: 'The variant does not exist or has been deleted.',
          },
        }
      );
    }
    let filteredSpecs = CarVariantService.removeHiddenSpecKeys(variant.specs_normalized, variant.hidden_spec_keys);
    filteredSpecs = CarVariantService.removeHiddenSections(filteredSpecs, variant.hidden_sections);
    filteredSpecs = CarVariantService.applyFuelTypeFilter(filteredSpecs, variant.fuel_type_id || '');
    filteredSpecs = CarVariantService.removeEmptyValues(filteredSpecs);
    filteredSpecs = CarVariantService.autoHideEmptySections(filteredSpecs);
    const filteredVariant = {
      ...variant,
      specs_normalized: filteredSpecs,
    };
    return ResponseUtil.success(res, filteredVariant, 'Variant retrieved successfully');
  });

  // Admin routes
  static getAllAdminVariants = catchAsync(async (req: Request, res: Response) => {
   try {
     console.log('🔵 getAllAdminVariants - Request query:', req.query);
    const startTime = Date.now();
    const includeDeleted = req.query.include_deleted === 'true';
    console.log('📋 Including deleted:', includeDeleted);
    const result = await CarVariantService.getAllVariants(req.query, includeDeleted);
    console.log('✅ Variants fetched:', result.variants.length, '| Pagination:', result.pagination);
    // Transform variants to display-ready format with flattened car metadata
    const transformedVariants = await VariantResponseTransformer.transformBatch(result.variants);
    VariantResponseTransformer.clearCache();
    const duration = Date.now() - startTime;
    console.log(`⏱️  getAllAdminVariants completed in ${duration}ms`);
    return ResponseUtil.paginated(res, transformedVariants, result.pagination, 'Variants retrieved successfully');
   } catch (error) {
    console.log(error);
   }
  });

  static getAdminVariantById = catchAsync(async (req: Request, res: Response) => {
    const variant = await CarVariantService.getVariantById(req.params.id as string);
    if (!variant) {
      throw new AppError(
        `Variant not found for variant_id: ${req.params.id}`,
        404,
        {
          userMessage: USER_MESSAGES.VARIANT_NOT_FOUND,
          errorCode: ERROR_CODES.VARIANT_NOT_FOUND,
          details: {
            field: 'variant_id',
            reason: 'The variant does not exist or has been deleted.',
          },
        }
      );
    }
    return ResponseUtil.success(res, variant, 'Variant retrieved successfully');
  });

  static createVariant = catchAsync(async (req: Request, res: Response) => {
    const createDto: CreateVariantDto = {
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

    const validation = CreateVariantDto.validate(createDto);
    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    const variant = await CarVariantService.createVariant(createDto, AuditUtil.actorFromRequest(req as AuthRequest));
    return ResponseUtil.created(res, variant, 'Variant created successfully');
  });

  static updateVariant = catchAsync(async (req: Request, res: Response) => {
    const updateDto: UpdateVariantDto = {
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

    const validation = UpdateVariantDto.validate(updateDto);
    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    const variant = await CarVariantService.updateVariant(req.params.id as string, updateDto, AuditUtil.actorFromRequest(req as AuthRequest));
    return ResponseUtil.success(res, variant, 'Variant updated successfully');
  });

  static deleteVariant = catchAsync(async (req: Request, res: Response) => {
    const variant = await CarVariantService.deleteVariant(req.params.id as string, AuditUtil.actorFromRequest(req as AuthRequest));
    return ResponseUtil.success(res, variant, 'Variant deleted successfully');
  });

  static restoreVariant = catchAsync(async (req: Request, res: Response) => {
    const variant = await CarVariantService.restoreVariant(req.params.id as string, AuditUtil.actorFromRequest(req as AuthRequest));
    return ResponseUtil.success(res, variant, 'Variant restored successfully');
  });

  static togglePublish = catchAsync(async (req: Request, res: Response) => {
    const variant = await CarVariantService.togglePublish(req.params.id as string, AuditUtil.actorFromRequest(req as AuthRequest));
    return ResponseUtil.success(res, variant, 'Variant publish status toggled successfully');
  });

  static publishVariant = catchAsync(async (req: Request, res: Response) => {
    const variant = await CarVariantService.publishVariant(req.params.id as string, AuditUtil.actorFromRequest(req as AuthRequest));
    return ResponseUtil.success(res, variant, 'Variant published successfully');
  });

  static unpublishVariant = catchAsync(async (req: Request, res: Response) => {
    const variant = await CarVariantService.unpublishVariant(req.params.id as string, AuditUtil.actorFromRequest(req as AuthRequest));
    return ResponseUtil.success(res, variant, 'Variant unpublished successfully');
  });

  static archiveVariant = catchAsync(async (req: Request, res: Response) => {
    const actor = AuditUtil.actorFromRequest(req as AuthRequest);
    const variant = await CarVariantService.archiveVariant(req.params.id as string, actor.user_id || undefined, actor);
    return ResponseUtil.success(res, variant, 'Variant archived successfully');
  });

  static unarchiveVariant = catchAsync(async (req: Request, res: Response) => {
    const variant = await CarVariantService.unarchiveVariant(req.params.id as string, AuditUtil.actorFromRequest(req as AuthRequest));
    return ResponseUtil.success(res, variant, 'Variant unarchived successfully');
  });

  // Lifecycle & Visibility endpoints
  static updateVisibility = catchAsync(async (req: Request, res: Response) => {
    const { section_visibility, estimated_fields } = req.body;

    if (!section_visibility && !estimated_fields) {
      throw new AppError('section_visibility or estimated_fields is required', 400);
    }

    let variant: any = await CarVariantService.getVariantById(req.params.id as string);
    if (!variant) {
      throw new AppError('Variant not found', 404);
    }

    // Update section visibility in parallel instead of sequential
    if (section_visibility && Array.isArray(section_visibility)) {
      await Promise.all(
        section_visibility.map(sv =>
          VariantLifecycleService.setSectionVisibility(
            req.params.id as string,
            sv.section_key,
            sv.visibility,
            sv.hidden_fields
          )
        )
      );
    }

    // Update estimated fields
    if (estimated_fields && Array.isArray(estimated_fields)) {
      await VariantLifecycleService.markFieldsAsEstimated(
        req.params.id as string,
        estimated_fields
      );
    }

    variant = await CarVariantService.getVariantById(req.params.id as string);
    return ResponseUtil.success(res, variant, 'Visibility updated successfully');
  });

  static unhideOnLaunch = catchAsync(async (req: Request, res: Response) => {
    const variant = await VariantLifecycleService.unhideAllSections(req.params.id as string);
    return ResponseUtil.success(res, variant, 'Variant sections unhidden for launch');
  });

  static getEstimationCompleteness = catchAsync(async (req: Request, res: Response) => {
    const completeness = await VariantLifecycleService.getEstimationCompleteness(
      req.params.id as string
    );
    return ResponseUtil.success(res, completeness, 'Estimation completeness retrieved');
  });

  // Difference engine endpoints
  static getVariantDifference = catchAsync(async (req: Request, res: Response) => {
    const difference = await DifferenceEngineService.calculateVariantDifference(req.params.id as string);
    return ResponseUtil.success(res, difference, 'Variant differences calculated');
  });

  static getCarVariantDifferences = catchAsync(async (req: Request, res: Response) => {
    const differences = await DifferenceEngineService.calculateCarVariantDifferences(req.params.carId as string);
    return ResponseUtil.success(res, differences, 'Variant differences for car calculated');
  });

  // Model aggregation endpoints
  static getModelAggregates = catchAsync(async (req: Request, res: Response) => {
    const aggregates = await ModelAggregationService.aggregateModelFromVariants(req.params.carId as string);
    return ResponseUtil.success(res, aggregates, 'Model aggregates retrieved');
  });

  // Validation endpoints
  static validateVariant = catchAsync(async (req: Request, res: Response) => {
    const validation = await VariantValidationService.validateVariant(req.params.id as string);
    return ResponseUtil.success(res, validation, 'Variant validation completed');
  });

  static validateCarVariants = catchAsync(async (req: Request, res: Response) => {
    const validations = await VariantValidationService.validateCarVariants(req.params.carId as string);
    return ResponseUtil.success(res, validations, 'Car variants validation completed');
  });

  static bulkValidate = catchAsync(async (req: Request, res: Response) => {
    const { variant_ids } = req.body;
    if (!variant_ids || !Array.isArray(variant_ids)) {
      throw new AppError('variant_ids array is required', 400);
    }
    const validations = await VariantBulkService.bulkValidate(variant_ids);
    return ResponseUtil.success(res, validations, 'Bulk validation completed');
  });

  // Completeness endpoints
  static getVariantCompleteness = catchAsync(async (req: Request, res: Response) => {
    const completeness = await VariantCompletenessService.getVariantCompleteness(req.params.id as string);
    return ResponseUtil.success(res, completeness, 'Variant completeness retrieved');
  });

  static getCarCompleteness = catchAsync(async (req: Request, res: Response) => {
    const report = await VariantCompletenessService.getCarCompleteness(req.params.carId as string);
    return ResponseUtil.success(res, report, 'Car completeness report retrieved');
  });

  // Bulk operations endpoints
  static bulkUpdateStatus = catchAsync(async (req: Request, res: Response) => {
    const { variant_ids, status } = req.body;
    if (!variant_ids || !Array.isArray(variant_ids) || !status) {
      throw new AppError('variant_ids array and status are required', 400);
    }
    const changedBy = (req as AuthRequest).user?.email || 'system';
    const result = await VariantBulkService.bulkUpdateStatus(variant_ids, status, changedBy);
    return ResponseUtil.success(res, result, 'Bulk status update completed');
  });

  static bulkPublish = catchAsync(async (req: Request, res: Response) => {
    const { variant_ids, should_publish } = req.body;
    if (!variant_ids || !Array.isArray(variant_ids) || should_publish === undefined) {
      throw new AppError('variant_ids array and should_publish are required', 400);
    }
    const changedBy = (req as AuthRequest).user?.email || 'system';
    const result = await VariantBulkService.bulkPublish(variant_ids, should_publish, changedBy);
    return ResponseUtil.success(res, result, 'Bulk publish update completed');
  });

  static bulkUpdateVisibility = catchAsync(async (req: Request, res: Response) => {
    const { variant_ids, hidden_sections } = req.body;
    if (!variant_ids || !Array.isArray(variant_ids) || !hidden_sections) {
      throw new AppError('variant_ids array and hidden_sections are required', 400);
    }
    const changedBy = (req as AuthRequest).user?.email || 'system';
    const result = await VariantBulkService.bulkUpdateVisibility(variant_ids, hidden_sections, changedBy);
    return ResponseUtil.success(res, result, 'Bulk visibility update completed');
  });

  static bulkUpdate = catchAsync(async (req: Request, res: Response) => {
    const { variant_ids, updates } = req.body;
    if (!variant_ids || !Array.isArray(variant_ids) || !updates) {
      throw new AppError('variant_ids array and updates are required', 400);
    }
    const changedBy = (req as AuthRequest).user?.email || 'system';
    const result = await VariantBulkService.bulkUpdate({ variant_ids, updates }, changedBy);
    return ResponseUtil.success(res, result, 'Bulk update completed');
  });

  static bulkExportCsv = catchAsync(async (req: Request, res: Response) => {
    const { variant_ids } = req.body;
    if (!variant_ids || !Array.isArray(variant_ids)) {
      throw new AppError('variant_ids array is required', 400);
    }
    const csv = await VariantBulkService.bulkExportCsv(variant_ids);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="variants.csv"');
    return res.send(csv);
  });

  // Spec refinement endpoints
  static refineVariantSpecs = catchAsync(async (req: Request, res: Response) => {
    const refinement = await SpecRefinementService.refineVariantSpecs(req.params.id as string);
    return ResponseUtil.success(res, refinement, 'Spec refinement suggestions generated');
  });

  static applyRefinementSuggestions = catchAsync(async (req: Request, res: Response) => {
    const { suggestions } = req.body;
    if (!suggestions || !Array.isArray(suggestions)) {
      throw new AppError('suggestions array is required', 400);
    }
    const updated = await SpecRefinementService.applyRefinementSuggestions(req.params.id as string, suggestions);
    return ResponseUtil.success(res, updated, 'Refinement suggestions applied');
  });

  static refineMultipleVariants = catchAsync(async (req: Request, res: Response) => {
    const { variant_ids } = req.body;
    if (!variant_ids || !Array.isArray(variant_ids)) {
      throw new AppError('variant_ids array is required', 400);
    }
    const results = await SpecRefinementService.refineMultipleVariants(variant_ids);
    return ResponseUtil.success(res, results, 'Spec refinement for multiple variants completed');
  });

  // Change history endpoints (Batch 6 Feature 2)
  static getVariantChangeHistory = catchAsync(async (req: Request, res: Response) => {
    const { field, source, startDate, endDate, limit } = req.query;
    const history = await VariantIntegrityService.getChangeHistory(req.params.id as string, {
      field: field as string,
      source: source as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    return ResponseUtil.success(res, history, 'Change history retrieved');
  });

  static getVariantAuditTrail = catchAsync(async (req: Request, res: Response) => {
    const auditTrail = await VariantIntegrityService.getAuditTrail(req.params.id as string);
    return ResponseUtil.success(res, { audit_trail: auditTrail }, 'Audit trail retrieved');
  });

  // Validation endpoints (enhanced with Batch 6)
  static validateVariantFull = catchAsync(async (req: Request, res: Response) => {
    const validation = await VariantValidationService.validateVariantFull(req.params.id as string);
    return ResponseUtil.success(res, validation, 'Full validation completed');
  });

  static validateAutomotiveConstraints = catchAsync(async (req: Request, res: Response) => {
    const variant = await CarVariantService.getVariantById(req.params.id as string);
    if (!variant) {
      throw new AppError('Variant not found', 404);
    }
    const validation = VariantValidationService.validateAutomotiveConstraints(variant);
    return ResponseUtil.success(res, validation, 'Automotive constraint validation completed');
  });

  // Integrity endpoints (Batch 6 Feature 1)
  static getVariantIntegrityStatus = catchAsync(async (req: Request, res: Response) => {
    const status = await VariantIntegrityService.comprehensiveValidate(req.params.id as string);
    return ResponseUtil.success(res, status, 'Variant integrity status retrieved');
  });
}
