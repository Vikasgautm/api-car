import { ITag } from '../../../models/tag.model';
export declare class TagService {
    static getAll(filterDto: any, includeDeleted?: boolean): Promise<{
        tags: (ITag & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getById(tagId: string): Promise<(import("mongoose").Document<unknown, {}, ITag, {}, import("mongoose").DefaultSchemaOptions> & ITag & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static getBySlug(slug: string): Promise<(import("mongoose").Document<unknown, {}, ITag, {}, import("mongoose").DefaultSchemaOptions> & ITag & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static create(data: any): Promise<import("mongoose").Document<unknown, {}, ITag, {}, import("mongoose").DefaultSchemaOptions> & ITag & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static update(tagId: string, data: any): Promise<import("mongoose").Document<unknown, {}, ITag, {}, import("mongoose").DefaultSchemaOptions> & ITag & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static softDelete(tagId: string): Promise<import("mongoose").Document<unknown, {}, ITag, {}, import("mongoose").DefaultSchemaOptions> & ITag & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static restore(tagId: string): Promise<import("mongoose").Document<unknown, {}, ITag, {}, import("mongoose").DefaultSchemaOptions> & ITag & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static validateTagIds(tagIds: string[]): Promise<{
        valid: string[];
        invalid: string[];
    }>;
}
//# sourceMappingURL=tag.service.d.ts.map