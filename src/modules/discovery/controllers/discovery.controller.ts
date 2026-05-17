import { Request, Response } from 'express';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { DiscoveryService } from '../services/discovery.service';
import { SeoFilterGeneratorService } from '../services/seo-filter-generator.service';

export class DiscoveryController {
  static discover = catchAsync(async (req: Request, res: Response) => {
    const result = await DiscoveryService.discover(req.query as any);
    return ResponseUtil.paginated(
      res,
      result.cars,
      result.pagination,
      'Discovery results retrieved'
    );
  });

  /**
   * Same shape as `discover` but also surfaces the facets payload — useful for
   * the discovery sidebar. Kept separate so the public list endpoint can avoid
   * paying the facet cost if it doesn't need it.
   */
  static discoverWithFacets = catchAsync(async (req: Request, res: Response) => {
    const result = await DiscoveryService.discover(req.query as any);
    return ResponseUtil.success(
      res,
      {
        data: result.cars,
        pagination: result.pagination,
        facets: result.facets,
        applied: result.applied,
      },
      'Discovery results with facets'
    );
  });

  /** Pure count, used by SEO preset preview. */
  static count = catchAsync(async (req: Request, res: Response) => {
    const count = await DiscoveryService.count(req.query as any);
    return ResponseUtil.success(res, { count }, 'Match count retrieved');
  });

  /** Get all available SEO filters based on variant feature availability. */
  static seoFilters = catchAsync(async (req: Request, res: Response) => {
    const filters = await SeoFilterGeneratorService.getAllFeatures();
    return ResponseUtil.success(res, filters, 'SEO filters retrieved');
  });

  /** Auto-generate SEO presets for features with min variant count. Admin only. */
  static autoGeneratePresetsFromFilters = catchAsync(async (req: Request, res: Response) => {
    const minCount = req.body.min_variant_count || 5;
    const result = await SeoFilterGeneratorService.autoGeneratePresets(minCount);
    return ResponseUtil.success(res, result, `${result.presets_created} SEO presets auto-generated`);
  });
}
