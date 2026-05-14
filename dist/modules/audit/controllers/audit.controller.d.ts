import { Response } from 'express';
import { AuthRequest } from '../../../types/auth';
export declare class AuditController {
    static list: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static recent: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static stale: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static markReviewed: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=audit.controller.d.ts.map