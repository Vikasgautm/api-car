import { IImageSubCategory } from "../../../models/image-subcategory.model";
export declare class ImageSubCategoryService {
    static getAllImageSubCategories(filterDto: any): Promise<{
        subcategories: (IImageSubCategory & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getImageSubCategoryById(subcategoryId: string): Promise<(import("mongoose").Document<unknown, {}, IImageSubCategory, {}, import("mongoose").DefaultSchemaOptions> & IImageSubCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static getImageSubCategoryBySlug(slug: string): Promise<(import("mongoose").Document<unknown, {}, IImageSubCategory, {}, import("mongoose").DefaultSchemaOptions> & IImageSubCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static createImageSubCategory(subcategoryData: any): Promise<import("mongoose").Document<unknown, {}, IImageSubCategory, {}, import("mongoose").DefaultSchemaOptions> & IImageSubCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateImageSubCategory(subcategoryId: string, subcategoryData: any): Promise<import("mongoose").Document<unknown, {}, IImageSubCategory, {}, import("mongoose").DefaultSchemaOptions> & IImageSubCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static deleteImageSubCategory(subcategoryId: string): Promise<import("mongoose").Document<unknown, {}, IImageSubCategory, {}, import("mongoose").DefaultSchemaOptions> & IImageSubCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static restoreImageSubCategory(subcategoryId: string): Promise<import("mongoose").Document<unknown, {}, IImageSubCategory, {}, import("mongoose").DefaultSchemaOptions> & IImageSubCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static toggleImageSubCategoryActive(subcategoryId: string, is_active: boolean): Promise<import("mongoose").Document<unknown, {}, IImageSubCategory, {}, import("mongoose").DefaultSchemaOptions> & IImageSubCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static reorderImageSubCategories(orders: Array<{
        _id: string;
        display_order: number;
    }>): Promise<void>;
}
//# sourceMappingURL=image-subcategory.service.d.ts.map