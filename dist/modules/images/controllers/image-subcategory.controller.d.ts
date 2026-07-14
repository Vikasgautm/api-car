import { Response } from 'express';
export declare class ImageSubCategoryController {
    static getAllImageSubCategories: (req: any, res: Response, next: import("express").NextFunction) => void;
    static getImageSubCategoryById: (req: any, res: Response, next: import("express").NextFunction) => void;
    static getImageSubCategoryBySlug: (req: any, res: Response, next: import("express").NextFunction) => void;
    static createImageSubCategory: (req: any, res: Response, next: import("express").NextFunction) => void;
    static updateImageSubCategory: (req: any, res: Response, next: import("express").NextFunction) => void;
    static deleteImageSubCategory: (req: any, res: Response, next: import("express").NextFunction) => void;
    static restoreImageSubCategory: (req: any, res: Response, next: import("express").NextFunction) => void;
    static toggleImageSubCategoryActive: (req: any, res: Response, next: import("express").NextFunction) => void;
    static reorderImageSubCategories: (req: any, res: Response, next: import("express").NextFunction) => void;
}
