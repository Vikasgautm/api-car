import { MainCategory } from './media-constants';
export interface FileValidationResult {
    valid: boolean;
    error?: string;
}
export declare class MediaValidationService {
    static validateAutomotiveFile(file: Express.Multer.File): FileValidationResult;
    static validateBrandLogoFile(file: Express.Multer.File): FileValidationResult;
    static validateSubCategory(mainCategory: MainCategory, subCategory: string): FileValidationResult;
}
