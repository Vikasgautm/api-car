import { Request, Response } from 'express';
export declare class ImportController {
    static previewCarImport(req: Request, res: Response): Promise<void>;
    static saveCarImport(req: Request, res: Response): Promise<void>;
    static previewVariantImport(req: Request, res: Response): Promise<void>;
    static saveVariantImport(req: Request, res: Response): Promise<void>;
    static getImportLogs(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=import.controller.d.ts.map