import { IssueCategory, IssueSeverity, IssuesQueryParams } from "../dto/content-health.dto";
import { Request, Response } from 'express';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { ContentHealthService } from '../services/content-health.service';

const MAX_LIMIT = 100;

function parseQueryParams(query: Record<string, any>): IssuesQueryParams {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit as string, 10) || 20));

  const validSeverities: IssueSeverity[] = ['critical', 'high', 'medium', 'low'];
  const validCategories: IssueCategory[] = [
    'seo_health', 'variant_health', 'image_health', 'url_health',
    'import_health', 'taxonomy_health', 'schema_readiness',
    'publishing_health', 'content_quality',
  ];

  const severity = validSeverities.includes(query.severity) ? (query.severity as IssueSeverity) : undefined;
  const category = validCategories.includes(query.category) ? (query.category as IssueCategory) : undefined;
  const entity_type = typeof query.entity_type === 'string' ? query.entity_type.slice(0, 50) : undefined;
  const search = typeof query.search === 'string' ? query.search.slice(0, 100) : undefined;

  return { page, limit, severity, category, entity_type, search };
}

export class ContentHealthController {
  static getSummary = catchAsync(async (_req: Request, res: Response) => {
    const summary = await ContentHealthService.getSummary();
    return ResponseUtil.success(res, summary, 'Content health summary retrieved');
  });

  static getIssues = catchAsync(async (req: Request, res: Response) => {
    const params = parseQueryParams(req.query as Record<string, any>);
    const result = await ContentHealthService.getIssues(params);
    return ResponseUtil.paginated(
      res,
      result.issues,
      result.pagination,
      'Content health issues retrieved',
    );
  });

  static getIssuesByCategory = catchAsync(async (req: Request, res: Response) => {
    const validCategories: IssueCategory[] = [
      'seo_health', 'variant_health', 'image_health', 'url_health',
      'import_health', 'taxonomy_health', 'schema_readiness',
      'publishing_health', 'content_quality',
    ];

    const category = req.params.category as IssueCategory;
    if (!validCategories.includes(category)) {
      return ResponseUtil.badRequest(res, `Invalid category: ${category}`);
    }

    const params = parseQueryParams(req.query as Record<string, any>);
    const result = await ContentHealthService.getIssuesByCategory(category, params);
    return ResponseUtil.paginated(
      res,
      result.issues,
      result.pagination,
      `Issues for category "${category}" retrieved`,
    );
  });

  static getEntityIssues = catchAsync(async (req: Request, res: Response) => {
    const validEntityTypes = ['car', 'variant', 'redirect', 'import', 'body_type', 'fuel_type', 'car_image'];
    const entityType = req.params.type as string;
    const entityId = req.params.id as string;

    if (!validEntityTypes.includes(entityType)) {
      return ResponseUtil.badRequest(res, `Invalid entity type: ${entityType}`);
    }
    if (!entityId || entityId.length > 100) {
      return ResponseUtil.badRequest(res, 'Invalid entity ID');
    }

    const result = await ContentHealthService.getEntityIssues(entityType, entityId);
    return ResponseUtil.success(res, result, `Issues for ${entityType}/${entityId} retrieved`);
  });
}
