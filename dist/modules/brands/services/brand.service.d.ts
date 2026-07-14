import { IBrand } from '../../../models/brand.model';
export declare class BrandService {
    static getAllBrands(filterDto: any, includeDeleted?: boolean): Promise<{
        brands: (IBrand & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getBrandById(brandId: string): Promise<(IBrand & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static getBrandBySlug(slug: string): Promise<(IBrand & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static createBrand(brandData: any): Promise<any>;
    static updateBrand(brandId: string, brandData: any): Promise<IBrand & import("../../../sql/common/BaseModel").SQLDocument>;
    static deleteBrand(brandId: string): Promise<IBrand & import("../../../sql/common/BaseModel").SQLDocument>;
    static restoreBrand(brandId: string): Promise<IBrand & import("../../../sql/common/BaseModel").SQLDocument>;
    static togglePublish(brandId: string): Promise<IBrand & import("../../../sql/common/BaseModel").SQLDocument>;
    static refreshAggregates(brandId: string): Promise<import("../../../models/brand.model").IBrandAggregatesCache>;
    static refreshAllAggregates(): Promise<{
        processed: number;
        errors: number;
    }>;
}
