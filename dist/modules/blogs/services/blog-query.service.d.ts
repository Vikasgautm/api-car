export declare class BlogQueryService {
    static getRelatedByCar(carId: string, limit?: number): Promise<(import("../../../models/blog.model").IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static getRelatedByBrand(brandId: string, limit?: number): Promise<(import("../../../models/blog.model").IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static getRelatedByFuelType(fuelId: string, limit?: number): Promise<(import("../../../models/blog.model").IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static getRelatedByBodyType(bodyTypeId: string, limit?: number): Promise<(import("../../../models/blog.model").IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static getRelatedByComparison(comparisonId: string, limit?: number): Promise<(import("../../../models/blog.model").IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static getStaleBlogs(limit?: number): Promise<(import("../../../models/blog.model").IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static getOrphanBlogs(limit?: number): Promise<(import("../../../models/blog.model").IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
}
//# sourceMappingURL=blog-query.service.d.ts.map