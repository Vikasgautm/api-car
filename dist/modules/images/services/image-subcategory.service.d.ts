import { IImageSubCategory } from "../../../models/image-subcategory.model";
export declare class ImageSubCategoryService {
    static getAllImageSubCategories(filterDto: any, includeDeleted?: boolean): Promise<{
        subcategories: (IImageSubCategory & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getImageSubCategoryById(subcategoryId: string): Promise<(IImageSubCategory & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static getImageSubCategoryBySlug(slug: string): Promise<(IImageSubCategory & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static createImageSubCategory(subcategoryData: any): Promise<any>;
    static updateImageSubCategory(subcategoryId: string, subcategoryData: any): Promise<IImageSubCategory & import("../../../sql/common/BaseModel").SQLDocument>;
    static deleteImageSubCategory(subcategoryId: string): Promise<IImageSubCategory & import("../../../sql/common/BaseModel").SQLDocument>;
    static restoreImageSubCategory(subcategoryId: string): Promise<IImageSubCategory & import("../../../sql/common/BaseModel").SQLDocument>;
    static toggleImageSubCategoryActive(subcategoryId: string, is_active: boolean): Promise<IImageSubCategory & import("../../../sql/common/BaseModel").SQLDocument>;
    static reorderImageSubCategories(orders: Array<{
        _id: string;
        display_order: number;
    }>): Promise<void>;
}
