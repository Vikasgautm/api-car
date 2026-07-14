import { Response } from 'express';
export declare class ImageCategoryController {
    static getAllImageCategories: (req: any, res: Response, next: import("express").NextFunction) => void;
    static getImageCategoryById: (req: any, res: Response, next: import("express").NextFunction) => void;
    static getImageCategoryBySlug: (req: any, res: Response, next: import("express").NextFunction) => void;
    static createImageCategory: (req: any, res: Response, next: import("express").NextFunction) => void;
    static updateImageCategory: (req: any, res: Response, next: import("express").NextFunction) => void;
    static deleteImageCategory: (req: any, res: Response, next: import("express").NextFunction) => void;
    static restoreImageCategory: (req: any, res: Response, next: import("express").NextFunction) => void;
    static toggleImageCategoryActive: (req: any, res: Response, next: import("express").NextFunction) => void;
    static reorderImageCategories: (req: any, res: Response, next: import("express").NextFunction) => void;
}
