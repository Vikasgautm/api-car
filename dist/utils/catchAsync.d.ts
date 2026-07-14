import { NextFunction, Request, Response } from 'express';
export declare const catchAsync: <T extends Request = Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<any>) => (req: T, res: Response, next: NextFunction) => void;
