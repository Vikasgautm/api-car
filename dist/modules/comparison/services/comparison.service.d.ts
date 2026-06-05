import { IComparison } from '../../../models/comparison.model';
import { IComparisonRival } from '../../../models/comparison-rival.model';
import { CreateComparisonDTOType, UpdateComparisonDTOType } from '../../../shared/dto/comparison.dto';
import mongoose from 'mongoose';
export declare class ComparisonService {
    static createComparison(data: CreateComparisonDTOType, userId: string): Promise<IComparison>;
    static updateComparison(comparisonId: string, data: UpdateComparisonDTOType, userId: string): Promise<IComparison>;
    static deleteComparison(comparisonId: string, userId: string): Promise<void>;
    static restoreComparison(comparisonId: string, userId: string): Promise<IComparison>;
    static getComparisons(page?: number, limit?: number, filter?: {
        search?: string;
        category?: string;
        status?: string;
        isPopular?: boolean;
        isTrending?: boolean;
        is_deleted?: boolean;
    }): Promise<{
        comparisons: any[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    static getComparisonBySlug(slug: string): Promise<any>;
    static getComparisonById(id: string): Promise<any>;
    static addRival(primaryCarId: string, rivalCarId: string, userId: string, strength?: number): Promise<void>;
    static removeRival(primaryCarId: string, rivalCarId: string, userId: string): Promise<void>;
    static getRivals(carId: string, limit?: number): Promise<IComparisonRival[]>;
    static getPopularComparisons(category?: string, limit?: number): Promise<(IComparison & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static getTrendingComparisons(limit?: number): Promise<(IComparison & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static getComparisonsByCategory(category: string, page?: number, limit?: number): Promise<{
        comparisons: (IComparison & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
}
//# sourceMappingURL=comparison.service.d.ts.map