import { IBodyType } from "../../../models/body-type.model";
export declare class BodyTypeService {
    static getAllBodyTypes(filterDto: any, includeDeleted?: boolean): Promise<{
        bodyTypes: (import("mongoose").Document<unknown, {}, IBodyType, {}, import("mongoose").DefaultSchemaOptions> & IBodyType & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getBodyTypeById(bodyTypeId: string): Promise<(import("mongoose").Document<unknown, {}, IBodyType, {}, import("mongoose").DefaultSchemaOptions> & IBodyType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static getBodyTypeBySlug(slug: string): Promise<(import("mongoose").Document<unknown, {}, IBodyType, {}, import("mongoose").DefaultSchemaOptions> & IBodyType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static createBodyType(bodyTypeData: any): Promise<import("mongoose").Document<unknown, {}, IBodyType, {}, import("mongoose").DefaultSchemaOptions> & IBodyType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateBodyType(bodyTypeId: string, bodyTypeData: any): Promise<import("mongoose").Document<unknown, {}, IBodyType, {}, import("mongoose").DefaultSchemaOptions> & IBodyType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static deleteBodyType(bodyTypeId: string): Promise<(import("mongoose").Document<unknown, {}, IBodyType, {}, import("mongoose").DefaultSchemaOptions> & IBodyType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static restoreBodyType(bodyTypeId: string): Promise<import("mongoose").Document<unknown, {}, IBodyType, {}, import("mongoose").DefaultSchemaOptions> & IBodyType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static togglePublish(bodyTypeId: string): Promise<import("mongoose").Document<unknown, {}, IBodyType, {}, import("mongoose").DefaultSchemaOptions> & IBodyType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=bodyType.service.d.ts.map