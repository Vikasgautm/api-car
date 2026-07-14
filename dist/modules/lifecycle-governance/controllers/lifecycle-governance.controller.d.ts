import { Response } from 'express';
import { AuthRequest } from '../../../types/auth';
export declare class LifecycleGovernanceController {
    static createRequest: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static approveRequest: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static verifyOTP: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static rejectRequest: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static cancelRequest: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static listRequests: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static getPendingForCar: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
}
