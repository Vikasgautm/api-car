import { Request, Response } from 'express';
export declare class DashboardController {
    static getOverview(req: Request, res: Response): Promise<void>;
    static getPriorities(req: Request, res: Response): Promise<void>;
    static getContentHealth(req: Request, res: Response): Promise<void>;
    static getRecentActivity(req: Request, res: Response): Promise<void>;
    static getSeoSummary(req: Request, res: Response): Promise<void>;
    static getImportHealth(req: Request, res: Response): Promise<void>;
    static getFuelSummary(req: Request, res: Response): Promise<void>;
    static getComparisonSummary(req: Request, res: Response): Promise<void>;
    static globalSearch(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=dashboard.controller.d.ts.map