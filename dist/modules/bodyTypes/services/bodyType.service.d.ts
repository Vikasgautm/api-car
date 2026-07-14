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
    static getBodyTypeBySlug(slug: string): Promise<(IBodyType & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static createBodyType(bodyTypeData: any): Promise<any>;
    static updateBodyType(bodyTypeId: string, bodyTypeData: any): Promise<IBodyType & import("../../../sql/common/BaseModel").SQLDocument>;
    static deleteBodyType(bodyTypeId: string): Promise<(IBodyType & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static restoreBodyType(bodyTypeId: string): Promise<IBodyType & import("../../../sql/common/BaseModel").SQLDocument>;
    static togglePublish(bodyTypeId: string): Promise<IBodyType & import("../../../sql/common/BaseModel").SQLDocument>;
}
