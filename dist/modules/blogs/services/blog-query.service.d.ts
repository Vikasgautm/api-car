export declare class BlogQueryService {
    static getRelatedByCar(carId: string, limit?: number): Promise<(import("../../../models/blog.model").IBlog & import("../../../sql/common/BaseModel").SQLDocument)[]>;
    static getRelatedByBrand(brandId: string, limit?: number): Promise<(import("../../../models/blog.model").IBlog & import("../../../sql/common/BaseModel").SQLDocument)[]>;
    static getRelatedByFuelType(fuelId: string, limit?: number): Promise<(import("../../../models/blog.model").IBlog & import("../../../sql/common/BaseModel").SQLDocument)[]>;
    static getRelatedByBodyType(bodyTypeId: string, limit?: number): Promise<(import("../../../models/blog.model").IBlog & import("../../../sql/common/BaseModel").SQLDocument)[]>;
    static getRelatedByComparison(comparisonId: string, limit?: number): Promise<(import("../../../models/blog.model").IBlog & import("../../../sql/common/BaseModel").SQLDocument)[]>;
    static getStaleBlogs(limit?: number): Promise<(import("../../../models/blog.model").IBlog & import("../../../sql/common/BaseModel").SQLDocument)[]>;
    static getOrphanBlogs(limit?: number): Promise<(import("../../../models/blog.model").IBlog & import("../../../sql/common/BaseModel").SQLDocument)[]>;
}
