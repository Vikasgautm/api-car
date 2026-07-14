import { Request, Response } from 'express';
export declare class UnifiedImportController {
    /**
     * POST /imports/unified/preview
     * Accepts { source, carUrl, variantUrl } and returns a combined preview
     * with matched fields, unmatched fields (with suggestions), and availableTargetFields.
     */
    static unifiedPreview: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
    /**
     * POST /imports/unified/save
     * Accepts full save payload with manual mappings and ignored keys.
     */
    static unifiedSave: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
    /**
     * GET /imports/available-fields
     * Returns all available target fields grouped by section.
     */
    static getAvailableFields: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
    /**
     * GET /imports/key-mappings
     * Returns all saved admin key mappings, optionally filtered by source/model.
     */
    static getKeyMappings: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
    /**
     * DELETE /imports/key-mappings/:mapping_id
     * Deactivates a saved key mapping.
     */
    static deleteKeyMapping: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
}
