import { NextFunction, Request, Response } from 'express';
export declare const rolesGuard: (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const adminGuard: (req: Request, res: Response, next: NextFunction) => void;
export declare const editorGuard: (req: Request, res: Response, next: NextFunction) => void;
