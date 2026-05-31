import { NextFunction, Request, Response } from "express";
export { AppError, ErrorCode } from "../shared/utils/app-error.util";
export declare const errorMiddleware: (err: any, req: Request, _res: Response, _next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=error.middleware.d.ts.map