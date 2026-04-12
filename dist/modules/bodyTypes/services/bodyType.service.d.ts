export declare class BodyTypeService {
    static getAllBodyTypes(query: any): Promise<{
        body_types: (import("mongoose").Document<unknown, {}, import("../../../models/body-type.model").IBodyType, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/body-type.model").IBodyType & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    static getBodyTypeBySlug(slug: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/body-type.model").IBodyType, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/body-type.model").IBodyType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static getBodyTypeById(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/body-type.model").IBodyType, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/body-type.model").IBodyType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static updateBodyType(id: string, bodyTypeData: any): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/body-type.model").IBodyType, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/body-type.model").IBodyType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static deleteBodyType(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/body-type.model").IBodyType, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/body-type.model").IBodyType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static restoreBodyType(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/body-type.model").IBodyType, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/body-type.model").IBodyType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static createBodyType(bodyTypeData: any): Promise<import("mongoose").Document<unknown, {}, import("../../../models/body-type.model").IBodyType, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/body-type.model").IBodyType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=bodyType.service.d.ts.map