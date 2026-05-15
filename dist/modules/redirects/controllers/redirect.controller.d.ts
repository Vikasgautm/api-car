import { Response } from 'express';
import { AuthRequest } from '../../../types/auth';
export declare class RedirectController {
    static list: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static getById: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static create: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static update: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static remove: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static restore: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    /** Public: resolve a path through the redirect table. Used by the frontend. */
    static resolvePublic: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=redirect.controller.d.ts.map