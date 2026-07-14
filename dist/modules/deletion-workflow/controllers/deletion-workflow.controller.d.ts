import { Response } from 'express';
import { AuthRequest } from '../../../types/auth';
export declare class DeletionWorkflowController {
    static create: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static verify: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static cancel: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static list: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
}
