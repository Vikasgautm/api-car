import { IImageCategory } from "../../../models/image-category.model";
export declare class ImageCategoryService {
    static getAllImageCategories(filterDto: any, includeDeleted?: boolean): Promise<{
        categories: (IImageCategory & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getImageCategoryById(categoryId: string): Promise<(IImageCategory & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static getImageCategoryBySlug(slug: string): Promise<(IImageCategory & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static createImageCategory(categoryData: any): Promise<any>;
    static updateImageCategory(categoryId: string, categoryData: any): Promise<IImageCategory & import("../../../sql/common/BaseModel").SQLDocument>;
    static deleteImageCategory(categoryId: string): Promise<IImageCategory & import("../../../sql/common/BaseModel").SQLDocument>;
    static restoreImageCategory(categoryId: string): Promise<IImageCategory & import("../../../sql/common/BaseModel").SQLDocument>;
    static toggleImageCategoryActive(categoryId: string, is_active: boolean): Promise<IImageCategory & import("../../../sql/common/BaseModel").SQLDocument>;
    static reorderImageCategories(orders: Array<{
        _id: string;
        display_order: number;
    }>): Promise<void>;
}
