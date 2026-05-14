import { ITagCategory } from '../../../models/tag-category.model';
export declare class TagCategoryService {
    static getAll(filterDto: any, includeDeleted?: boolean): Promise<{
        categories: (ITagCategory & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getById(tagCategoryId: string): Promise<(import("mongoose").Document<unknown, {}, ITagCategory, {}, import("mongoose").DefaultSchemaOptions> & ITagCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static getBySlug(slug: string): Promise<(import("mongoose").Document<unknown, {}, ITagCategory, {}, import("mongoose").DefaultSchemaOptions> & ITagCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static create(data: any): Promise<import("mongoose").Document<unknown, {}, ITagCategory, {}, import("mongoose").DefaultSchemaOptions> & ITagCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static update(tagCategoryId: string, data: any): Promise<import("mongoose").Document<unknown, {}, ITagCategory, {}, import("mongoose").DefaultSchemaOptions> & ITagCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static softDelete(tagCategoryId: string): Promise<import("mongoose").Document<unknown, {}, ITagCategory, {}, import("mongoose").DefaultSchemaOptions> & ITagCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static restore(tagCategoryId: string): Promise<import("mongoose").Document<unknown, {}, ITagCategory, {}, import("mongoose").DefaultSchemaOptions> & ITagCategory & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=tag-category.service.d.ts.map