import { ITagCategory } from '../../../models/tag-category.model';
export declare class TagCategoryService {
    static getAll(filterDto: any, includeDeleted?: boolean): Promise<{
        categories: (ITagCategory & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getById(tagCategoryId: string): Promise<(ITagCategory & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static getBySlug(slug: string): Promise<(ITagCategory & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static create(data: any): Promise<any>;
    static update(tagCategoryId: string, data: any): Promise<ITagCategory & import("../../../sql/common/BaseModel").SQLDocument>;
    static softDelete(tagCategoryId: string): Promise<ITagCategory & import("../../../sql/common/BaseModel").SQLDocument>;
    static restore(tagCategoryId: string): Promise<ITagCategory & import("../../../sql/common/BaseModel").SQLDocument>;
}
