/**
 * Import Normalizer Controller
 * Test and integrate the normalization engine
 */
import { Request, Response } from 'express';
export declare class ImportNormalizerController {
    /**
     * POST /admin/imports/normalize
     * Test normalization on raw specs
     */
    static normalizeSpecs(req: Request, res: Response): Promise<void>;
    /**
     * POST /admin/imports/detect-powertrain
     * Detect powertrain capabilities from specs
     */
    static detectPowertrain(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=import-normalizer.controller.d.ts.map