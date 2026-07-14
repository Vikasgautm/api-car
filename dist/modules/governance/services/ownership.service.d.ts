export interface BrandOwnershipEntry {
    brand_id: string;
    brand_name: string;
    brand_slug: string;
    logo?: string;
    owner_id?: string;
    owner_name?: string;
    owner_email?: string;
    total_cars: number;
    total_variants: number;
    ev_count: number;
}
export interface UserWorkloadSummary {
    user_id: string;
    user_name: string;
    email: string;
    governance_role?: string;
    brand_count: number;
    assigned_brands: string[];
    domain_count: number;
    is_overloaded: boolean;
}
export declare class OwnershipService {
    static getUserBrands(userId: string): Promise<(import("../../../models/brand.model").IBrand & import("../../../sql/common/BaseModel").SQLDocument)[]>;
    static getBrandOwners(brandId: string): Promise<(import("../../../models/user.model").IUser & import("../../../sql/common/BaseModel").SQLDocument)[]>;
    static assignBrand(userId: string, brandId: string): Promise<void>;
    static unassignBrand(userId: string, brandId: string): Promise<void>;
    static getOwnershipGrid(): Promise<BrandOwnershipEntry[]>;
    static getUnassignedBrands(): Promise<(import("../../../models/brand.model").IBrand & import("../../../sql/common/BaseModel").SQLDocument)[]>;
    static getWorkloadSummaries(): Promise<UserWorkloadSummary[]>;
}
