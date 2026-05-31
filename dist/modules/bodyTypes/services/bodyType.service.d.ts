import { IBodyType } from "../../../models/body-type.model";
export declare class BodyTypeService {
    static getAllBodyTypes(filterDto: any, includeDeleted?: boolean): Promise<{
        bodyTypes: any[];
        pagination: any;
    }>;
    static getStats(): Promise<{
        total: number;
        published: number;
        draft: number;
        archived: number;
        without_cars: number;
        missing_seo: number;
        missing_images: number;
    }>;
    static getArchiveImpact(bodyTypeId: string): Promise<{
        cars: number;
        variants: number;
        seo_collections: number;
        discovery_filters: number;
    }>;
    static checkDuplicate(name: string, excludeId?: string): Promise<{
        has_duplicate: boolean;
        name_duplicate: boolean;
        slug_duplicate: boolean;
        generated_slug: string;
    }>;
    static bulkOperation(ids: string[], action: 'publish' | 'unpublish' | 'archive' | 'restore'): Promise<{
        succeeded: number;
        failed: number;
        total: number;
    }>;
    static reorderBodyTypes(items: {
        body_type_id: string;
        sort_order: number;
    }[]): Promise<{
        updated: number;
    }>;
    static getBodyTypeById(bodyTypeId: string): Promise<any>;
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