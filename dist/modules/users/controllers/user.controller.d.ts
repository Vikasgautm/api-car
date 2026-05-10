import { Request, Response } from "express";
import { AuthRequest } from "../../../types/auth";
interface MulterRequest extends AuthRequest {
    file?: Express.Multer.File;
}
export declare class UserController {
    static getProfile: (req: AuthRequest, res: Response, next: import("express").NextFunction) => void;
    static updateProfile: (req: MulterRequest, res: Response, next: import("express").NextFunction) => void;
    static getAllAdminUsers: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
    static createAdminUser: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
    static getAdminUserById: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
    static deleteUser: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
    static restoreUser: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
    static updateUser: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
}
export {};
//# sourceMappingURL=user.controller.d.ts.map