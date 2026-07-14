import { Response } from 'express';
import { AuthRequest } from '../../../types/auth';
export declare class IntelligenceController {
    static getBenchmarkMatrix: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static upsertOverride: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static deleteOverride: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static reclassifyAll: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
}
