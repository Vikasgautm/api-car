import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../types/auth';
import { ComparisonService } from '../services/comparison.service';
import {
  CreateComparisonDTO,
  UpdateComparisonDTO,
  ComparisonQueryDTO,
  CreateRivalDTO,
} from '../../../shared/dto/comparison.dto';
import { AppError } from '../../../shared/utils/app-error.util';

function getQueryString(value: any): string | undefined {
  if (Array.isArray(value)) return value[0];
  if (typeof value === 'string') return value;
  return undefined;
}

function getQueryValue(value: any): any {
  if (Array.isArray(value)) return value[0];
  return value;
}

export class ComparisonController {
  static async createComparison(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = CreateComparisonDTO.parse(req.body);
      const userId = req.user?.id || req.user?.user_id || '';

      const comparison = await ComparisonService.createComparison(data, userId);

      res.status(201).json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateComparison(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getQueryString(req.params.id) || '';
      const data = UpdateComparisonDTO.parse(req.body);
      const userId = req.user?.id || req.user?.user_id || '';

      const comparison = await ComparisonService.updateComparison(id, data, userId);

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteComparison(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getQueryString(req.params.id) || '';
      const userId = req.user?.id || req.user?.user_id || '';

      await ComparisonService.deleteComparison(id, userId);

      res.json({
        success: true,
        message: 'Comparison deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async restoreComparison(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getQueryString(req.params.id) || '';
      const userId = req.user?.id || req.user?.user_id || '';

      const comparison = await ComparisonService.restoreComparison(id, userId);

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getComparisons(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const queryObj: any = {
        page: getQueryValue(req.query.page),
        limit: getQueryValue(req.query.limit),
        search: getQueryString(req.query.search),
        category: getQueryString(req.query.category),
        status: getQueryString(req.query.status),
        isPopular: getQueryValue(req.query.isPopular),
        isTrending: getQueryValue(req.query.isTrending),
        is_deleted: getQueryValue(req.query.is_deleted),
      };

      // Restrict status and is_deleted filters for guest (unauthenticated) users to prevent draft leaks.
      const isAdmin = req.user && ['admin', 'super_admin'].includes(req.user.role);
      if (!isAdmin) {
        queryObj.status = 'published';
        queryObj.is_deleted = false;
      }

      const query = ComparisonQueryDTO.parse(queryObj);
      const { page, limit, ...filters } = query;

      const result = await ComparisonService.getComparisons(page, limit, filters);

      res.json({
        success: true,
        data: result.comparisons,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.pages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getComparisonById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getQueryString(req.params.id) || '';
      const comparison = await ComparisonService.getComparisonById(id);

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getComparisonBySlug(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const slug = getQueryString(req.params.slug) || '';
      const comparison = await ComparisonService.getComparisonBySlug(slug);

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addRival(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = CreateRivalDTO.parse(req.body);
      const userId = req.user?.id || req.user?.user_id || '';
      const strength = req.body.relationship_strength || 50;

      await ComparisonService.addRival(data.primary_car_id, data.rival_car_id, userId, strength);

      res.status(201).json({
        success: true,
        message: 'Rival added successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeRival(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const car_id = getQueryString(req.params.car_id) || '';
      const rival_id = getQueryString(req.params.rival_id) || '';
      const userId = req.user?.id || req.user?.user_id || '';

      await ComparisonService.removeRival(car_id, rival_id, userId);

      res.json({
        success: true,
        message: 'Rival removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRivals(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const car_id = getQueryString(req.params.car_id) || '';
      const limit = Number(getQueryString(req.query.limit)) || 10;
      const rivals = await ComparisonService.getRivals(car_id, limit);

      res.json({
        success: true,
        data: rivals,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPopularComparisons(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const category = getQueryString(req.query.category);
      const limit = Number(getQueryString(req.query.limit)) || 10;
      const comparisons = await ComparisonService.getPopularComparisons(
        category,
        limit,
      );

      res.json({
        success: true,
        data: comparisons,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTrendingComparisons(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = Number(getQueryString(req.query.limit)) || 10;
      const comparisons = await ComparisonService.getTrendingComparisons(limit);

      res.json({
        success: true,
        data: comparisons,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getComparisonsByCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const category = getQueryString(req.params.category) || '';
      const page = Number(getQueryString(req.query.page)) || 1;
      const limit = Number(getQueryString(req.query.limit)) || 10;

      const result = await ComparisonService.getComparisonsByCategory(
        category,
        page,
        limit,
      );

      res.json({
        success: true,
        data: result.comparisons,
        pagination: {
          total: result.total,
          page: page,
          limit: limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
