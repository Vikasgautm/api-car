import { ITag } from '../../../models/tag.model';
export declare class TagService {
    static getAll(filterDto: any, includeDeleted?: boolean): Promise<{
        tags: (ITag & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getById(tagId: string): Promise<(ITag & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static getBySlug(slug: string): Promise<(ITag & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static create(data: any): Promise<any>;
    static update(tagId: string, data: any): Promise<ITag & import("../../../sql/common/BaseModel").SQLDocument>;
    static softDelete(tagId: string): Promise<ITag & import("../../../sql/common/BaseModel").SQLDocument>;
    static restore(tagId: string): Promise<ITag & import("../../../sql/common/BaseModel").SQLDocument>;
    static validateTagIds(tagIds: string[]): Promise<{
        valid: string[];
        invalid: string[];
    }>;
}
