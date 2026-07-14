import { CreateComparisonDTOType, UpdateComparisonDTOType } from '../../../shared/validation/comparison-validation.schemas';
export declare class ComparisonService {
    static createComparison(data: CreateComparisonDTOType, userId: string): Promise<any>;
    static updateComparison(comparisonId: string, data: UpdateComparisonDTOType, userId: string): Promise<any>;
    static deleteComparison(comparisonId: string, userId: string): Promise<void>;
    static restoreComparison(comparisonId: string, userId: string): Promise<any>;
    static getComparisons(page?: number, limit?: number, filter?: {
        search?: string;
        category?: string;
        status?: string;
        isPopular?: boolean;
        isTrending?: boolean;
        is_deleted?: boolean;
    }): Promise<{
        comparisons: any[];
        total: any;
        page: number;
        limit: number;
        pages: number;
    }>;
    static getComparisonBySlug(slug: string): Promise<any>;
    static getComparisonById(id: string): Promise<any>;
    static addRival(primaryCarId: string, rivalCarId: string, userId: string, strength?: number): Promise<void>;
    static removeRival(primaryCarId: string, rivalCarId: string, userId: string): Promise<void>;
    static getRivals(carId: string, limit?: number): Promise<any[]>;
    static getPopularComparisons(category?: string, limit?: number): Promise<any[]>;
    static getTrendingComparisons(limit?: number): Promise<any[]>;
    static getComparisonsByCategory(category: string, page?: number, limit?: number): Promise<{
        comparisons: any[];
        total: any;
        page: number;
        limit: number;
    }>;
}
