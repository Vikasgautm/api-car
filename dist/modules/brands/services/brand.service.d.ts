export declare class BrandService {
    static getAllBrands(query: any): Promise<{
        brands: (import("mongoose").Document<unknown, {}, import("../../../models/brand.model").IBrand, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/brand.model").IBrand & Required<{
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
    static getBrandBySlug(slug: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/brand.model").IBrand, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/brand.model").IBrand & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static updateBrand(id: string, brandData: any): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/brand.model").IBrand, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/brand.model").IBrand & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static deleteBrand(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/brand.model").IBrand, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/brand.model").IBrand & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static restoreBrand(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/brand.model").IBrand, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/brand.model").IBrand & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static createBrand(brandData: any): Promise<import("mongoose").Document<unknown, {}, import("../../../models/brand.model").IBrand, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/brand.model").IBrand & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=brand.service.d.ts.map