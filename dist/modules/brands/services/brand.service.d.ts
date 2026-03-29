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
        page: any;
        limit: any;
    }>;
    static getBrandBySlug(slug: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/brand.model").IBrand, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/brand.model").IBrand & Required<{
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