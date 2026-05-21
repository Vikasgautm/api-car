import { Response } from 'express';
export declare class CarImageController {
    static getPublicGallery: (req: any, res: Response, next: import("express").NextFunction) => void;
    static getCarGallery: (req: any, res: Response, next: import("express").NextFunction) => void;
    static getImagesByCategory: (req: any, res: Response, next: import("express").NextFunction) => void;
    static getPrimaryWithFallback: (req: any, res: Response, next: import("express").NextFunction) => void;
    static getAllAdminCarImages: (req: any, res: Response, next: import("express").NextFunction) => void;
    static getAdminCarImageById: (req: any, res: Response, next: import("express").NextFunction) => void;
    static createCarImage: (req: any, res: Response, next: import("express").NextFunction) => void;
    static updateCarImage: (req: any, res: Response, next: import("express").NextFunction) => void;
    static deleteCarImage: (req: any, res: Response, next: import("express").NextFunction) => void;
    static restoreCarImage: (req: any, res: Response, next: import("express").NextFunction) => void;
    static togglePublish: (req: any, res: Response, next: import("express").NextFunction) => void;
    static setPrimaryImage: (req: any, res: Response, next: import("express").NextFunction) => void;
    static bulkUpdateStatus: (req: any, res: Response, next: import("express").NextFunction) => void;
    static bulkAssignCategory: (req: any, res: Response, next: import("express").NextFunction) => void;
    static bulkDelete: (req: any, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=car-image.controller.d.ts.map