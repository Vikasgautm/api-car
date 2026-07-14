import { Response } from 'express';
export declare class ImageController {
    static uploadImage: (req: any, res: Response, next: import("express").NextFunction) => void;
    static uploadImageWithSave: (req: any, res: Response, next: import("express").NextFunction) => void;
    static uploadMultipleImages: (req: any, res: Response, next: import("express").NextFunction) => void;
    static uploadMultipleImagesWithSave: (req: any, res: Response, next: import("express").NextFunction) => void;
    static listImages: (req: any, res: Response, next: import("express").NextFunction) => void;
    static getImage: (req: any, res: Response, next: import("express").NextFunction) => void;
    static deleteImage: (req: any, res: Response, next: import("express").NextFunction) => void;
    static updateImage: (req: any, res: Response, next: import("express").NextFunction) => void;
}
