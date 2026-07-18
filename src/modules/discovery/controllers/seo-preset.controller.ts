import { Request, Response } from 'express';
import { AppError } from '../../../shared/utils/app-error.util';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { SeoPresetService } from '../services/seo-preset.service';
import { CreateSeoPresetDto, UpdateSeoPresetDto } from '../dto/seo-preset.dto';

export class SeoPresetController {
  // ---- Public ----

  static getPublicBySlug = catchAsync(async (req: Request, res: Response) => {
    const result = await SeoPresetService.hydrate(req.params.slug as string, req.query.page as any);
    return ResponseUtil.success(res, result, 'SEO landing page resolved');
  });

  // ---- Admin ----

  static list = catchAsync(async (req: Request, res: Response) => {
    const result = await SeoPresetService.list({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      q: req.query.q ? String(req.query.q) : undefined,
      is_published: req.query.is_published === 'true' ? true : req.query.is_published === 'false' ? false : undefined,
      include_deleted: req.query.include_deleted === 'true',
    });
    return ResponseUtil.paginated(res, result.presets, result.pagination, 'SEO presets retrieved');
  });

  static getById = catchAsync(async (req: Request, res: Response) => {
    const idParam = req.params.id as string;
    const preset = await SeoPresetService.getById(idParam);
    if (!preset) throw AppError.notFound('SEO preset', 'preset_id', idParam);
    return ResponseUtil.success(res, preset, 'SEO preset retrieved');
  });

  static create = catchAsync(async (req: Request, res: Response) => {
    const dto: CreateSeoPresetDto = {
      // slug: req.body.slug,
      slug: req.body.slug?.trim().toLowerCase(),
      title: req.body.title,
      h1: req.body.h1,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
      hero_intro: req.body.hero_intro,
      query_params: req.body.query_params,
      is_published: req.body.is_published,
      sort_order: req.body.sort_order,
    };
    console.log("seo presetes data are hte here->", dto);
    const validation = CreateSeoPresetDto.validate(dto);
    console.log("test data pased or not chekoing g g ", validation);
    console.log(JSON.stringify(validation, null, 2));
    if (!validation.success) {
      console.log(validation.error.errors);
      throw new AppError(validation.error.errors.map((e: any) => e.message).join(', '), 400);

    }


    const created = await SeoPresetService.create(dto);
    return ResponseUtil.created(res, created, 'SEO preset created');
  });

  static update = catchAsync(async (req: Request, res: Response) => {
    const dto: UpdateSeoPresetDto = {
      slug: req.body.slug,
      title: req.body.title,
      h1: req.body.h1,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
      hero_intro: req.body.hero_intro,
      query_params: req.body.query_params,
      is_published: req.body.is_published,
      sort_order: req.body.sort_order,
    };
    const validation = UpdateSeoPresetDto.validate(dto);
    if (!validation.success) throw new AppError(validation.error.errors.map((e: any) => e.message).join(', '), 400);

    const updated = await SeoPresetService.update(req.params.id as string, dto);
    return ResponseUtil.success(res, updated, 'SEO preset updated');
  });

  static remove = catchAsync(async (req: Request, res: Response) => {
    const removed = await SeoPresetService.softDelete(req.params.id as string);
    return ResponseUtil.success(res, removed, 'SEO preset deleted');
  });
}
