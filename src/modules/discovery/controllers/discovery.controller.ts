import { Request, Response } from 'express';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { DiscoveryService } from '../services/discovery.service';

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
}
