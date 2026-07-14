import { BrandBodyBudgetResponse, BrandsResponse, BodyTypesResponse, BudgetResponse, FuelSummaryResponse, HealthResponse, LifecycleResponse, MultiFuelResponse, SeatingResponse } from '../dtos/fuel-types-intelligence.dto';
export declare class FuelTypesIntelligenceService {
    static getSummary(): Promise<FuelSummaryResponse>;
    static getBrands(): Promise<BrandsResponse>;
    static getBodyTypes(): Promise<BodyTypesResponse>;
    static getBudget(): Promise<BudgetResponse>;
    static getBrandBodyBudget(): Promise<BrandBodyBudgetResponse>;
    static getSeating(): Promise<SeatingResponse>;
    static getLifecycle(): Promise<LifecycleResponse>;
    static getHealth(): Promise<HealthResponse>;
    static getMultiFuel(): Promise<MultiFuelResponse>;
}
