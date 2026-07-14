import { Response } from 'express';
import { AuthRequest } from '../../../types/auth';
export declare class AuditController {
    static list: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static recent: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static stale: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static markReviewed: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static activity: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static imports: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static importDetail: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static alerts: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static entitySearch: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static entityHistory: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
}
