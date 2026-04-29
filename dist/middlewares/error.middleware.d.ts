import { NextFunction, Request, Response } from "express";
export { AppError, ErrorCode } from "../shared/utils/app-error.util";
export declare const errorMiddleware: (err: any, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=error.middleware.d.ts.map