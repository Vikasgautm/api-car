import { Request, Response, NextFunction } from 'express';
export declare const catchAsync: <T extends Request = Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=catchAsync.d.ts.map