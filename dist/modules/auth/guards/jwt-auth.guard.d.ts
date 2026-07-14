import { NextFunction, Request, Response } from 'express';
export declare const jwtAuthGuard: (req: Request, res: Response, next: NextFunction) => Promise<void>;
