import { IImageCategory } from "../../../models/image-category.model";
export declare class ImageCategoryService {
    static getAllImageCategories(filterDto: any): Promise<{
        categories: (IImageCategory & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getImageCategoryById(categoryId: string): Promise<(import("mongoose").Document<unknown, {}, IImageCategory, {}, import("mongoose").DefaultSchemaOptions> & IImageCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static getImageCategoryBySlug(slug: string): Promise<(import("mongoose").Document<unknown, {}, IImageCategory, {}, import("mongoose").DefaultSchemaOptions> & IImageCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static createImageCategory(categoryData: any): Promise<import("mongoose").Document<unknown, {}, IImageCategory, {}, import("mongoose").DefaultSchemaOptions> & IImageCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateImageCategory(categoryId: string, categoryData: any): Promise<import("mongoose").Document<unknown, {}, IImageCategory, {}, import("mongoose").DefaultSchemaOptions> & IImageCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static deleteImageCategory(categoryId: string): Promise<import("mongoose").Document<unknown, {}, IImageCategory, {}, import("mongoose").DefaultSchemaOptions> & IImageCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static restoreImageCategory(categoryId: string): Promise<import("mongoose").Document<unknown, {}, IImageCategory, {}, import("mongoose").DefaultSchemaOptions> & IImageCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static toggleImageCategoryActive(categoryId: string, is_active: boolean): Promise<import("mongoose").Document<unknown, {}, IImageCategory, {}, import("mongoose").DefaultSchemaOptions> & IImageCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static reorderImageCategories(orders: Array<{
        _id: string;
        display_order: number;
    }>): Promise<void>;
}
//# sourceMappingURL=image-category.service.d.ts.map