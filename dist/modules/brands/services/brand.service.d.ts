import { IBrand } from '../../../models/brand.model';
export declare class BrandService {
    static getAllBrands(filterDto: any, includeDeleted?: boolean): Promise<{
        brands: (import("mongoose").Document<unknown, {}, IBrand, {}, import("mongoose").DefaultSchemaOptions> & IBrand & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getBrandById(brandId: string): Promise<(import("mongoose").Document<unknown, {}, IBrand, {}, import("mongoose").DefaultSchemaOptions> & IBrand & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static getBrandBySlug(slug: string): Promise<(IBrand & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static createBrand(brandData: any): Promise<import("mongoose").Document<unknown, {}, IBrand, {}, import("mongoose").DefaultSchemaOptions> & IBrand & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateBrand(brandId: string, brandData: any): Promise<import("mongoose").Document<unknown, {}, IBrand, {}, import("mongoose").DefaultSchemaOptions> & IBrand & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static deleteBrand(brandId: string): Promise<import("mongoose").Document<unknown, {}, IBrand, {}, import("mongoose").DefaultSchemaOptions> & IBrand & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static restoreBrand(brandId: string): Promise<import("mongoose").Document<unknown, {}, IBrand, {}, import("mongoose").DefaultSchemaOptions> & IBrand & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static togglePublish(brandId: string): Promise<import("mongoose").Document<unknown, {}, IBrand, {}, import("mongoose").DefaultSchemaOptions> & IBrand & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static refreshAggregates(brandId: string): Promise<import("../../../models/brand.model").IBrandAggregatesCache>;
    static refreshAllAggregates(): Promise<{
        processed: number;
        errors: number;
    }>;
}
//# sourceMappingURL=brand.service.d.ts.map