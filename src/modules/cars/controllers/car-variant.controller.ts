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
    const includeDeleted = req.query.include_deleted === 'true';
    const result = await CarVariantService.getAllVariants(req.query, includeDeleted);
    return ResponseUtil.paginated(res, result.variants, result.pagination, 'Variants retrieved successfully');
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
}
