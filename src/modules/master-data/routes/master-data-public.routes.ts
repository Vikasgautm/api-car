import { Router, Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { MasterDataService } from '../services/master-data.service';

const router = Router();

// GET /api/v1/master-data/public/labels
// Unauthenticated. Returns { category_key: { value: label } } for all active options.
// Used by public car pages to display "CVT" instead of "cvt".
router.get('/labels', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const labelMap = await MasterDataService.getPublicLabelMap();
    return ResponseUtil.success(res, labelMap);
  } catch (err) { next(err); }
});

export default router;
