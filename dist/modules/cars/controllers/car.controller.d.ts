import { Request, Response } from "express";
interface MulterRequest extends Request {
    file?: Express.Multer.File;
    files?: {
        [fieldname: string]: Express.Multer.File[];
    } | Express.Multer.File[];
}
export declare class CarController {
    static getAllPublicCars: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
    static getPublicCarBySlug: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
    static getAllAdminCars: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
    static getAdminCarById: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
    static createCar: (req: MulterRequest, res: Response, next: import("express").NextFunction) => void;
    static updateCar: (req: MulterRequest, res: Response, next: import("express").NextFunction) => void;
    static deleteCar: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
    static restoreCar: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
    static togglePublish: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
    static markLaunched: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
    static markUpcoming: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response, next: import("express").NextFunction) => void;
}
export {};
//# sourceMappingURL=car.controller.d.ts.map