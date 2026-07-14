import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../types/auth';
export declare class ComparisonController {
    static createComparison(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static updateComparison(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static deleteComparison(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static restoreComparison(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static getComparisons(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static getComparisonById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static getComparisonBySlug(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static addRival(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static removeRival(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static getRivals(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static getPopularComparisons(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static getTrendingComparisons(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static getComparisonsByCategory(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
