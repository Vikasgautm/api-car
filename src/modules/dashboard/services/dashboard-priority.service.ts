import { ImportLog } from '../../../models/import-log.model';
import { getPool, mssql } from '../../../sql/utils/dbConnection';

export interface PriorityItem {
  id: string;
  title: string;
  description: string;
  count: number;
  severity: 'critical' | 'warning' | 'info';
  redirect_link: string;
  action_label: string;
}

export interface DashboardPriorities {
  items: PriorityItem[];
  total_issues: number;
  critical_count: number;
  warning_count: number;
}

export class DashboardPriorityService {
  static async getPriorities(): Promise<DashboardPriorities> {
    const pool = await getPool();

    let missingImagesRes = { recordset: [{ cnt: 0 }] };
    let missingSeoRes = { recordset: [{ cnt: 0 }] };
    let weakCollectionsRes = { recordset: [{ cnt: 0 }] };
    let emptyCollectionsRes = { recordset: [{ cnt: 0 }] };
    let staleUpcomingRes = { recordset: [{ cnt: 0 }] };
    let duplicateSlugsRes = { recordset: [{ cnt: 0 }] };
    let failedImports = 0;

    try {
      failedImports = await ImportLog.countDocuments({ status: 'failed' });
    } catch {
      failedImports = 0;
    }

    try {
      [
        missingSeoRes,
        missingImagesRes,
        staleUpcomingRes,
        duplicateSlugsRes,
      ] = await Promise.all([
        pool.request().query(`
          SELECT COUNT(*) as cnt FROM Cars 
          WHERE is_deleted = 0 
          AND is_published = 1 
          AND (meta_title IS NULL OR meta_title = '' OR meta_description IS NULL OR meta_description = '')
        `),
        pool.request().query(`
          SELECT COUNT(*) as cnt FROM Cars 
          WHERE is_deleted = 0 
          AND is_published = 1 
          AND (og_image IS NULL OR og_image = '')
        `),
        pool.request().query(`
          SELECT COUNT(*) as cnt FROM Cars 
          WHERE is_deleted = 0 
          AND status = 'upcoming' 
          AND launch_date < NOW()
        `),
        pool.request().query(`
          SELECT COUNT(*) as cnt FROM (
            SELECT slug FROM Cars 
            WHERE is_deleted = 0 
            GROUP BY slug 
            HAVING COUNT(*) > 1
          ) as t
        `),
      ]);
    } catch (err) {
      console.error('Priority queries partial failure:', err);
    }

    const missingSeo = missingSeoRes.recordset[0].cnt || 0;
    const missingImages = missingImagesRes.recordset[0].cnt || 0;
    const weakCollections = weakCollectionsRes.recordset[0].cnt || 0;
    const emptyCollections = emptyCollectionsRes.recordset[0].cnt || 0;
    const staleUpcoming = staleUpcomingRes.recordset[0].cnt || 0;
    const duplicateSlugs = duplicateSlugsRes.recordset[0].cnt || 0;

    const items: PriorityItem[] = [];

    if (failedImports > 0) {
      items.push({
        id: 'failed_imports',
        title: 'Failed Imports',
        description: `${failedImports} import(s) failed and require investigation`,
        count: failedImports,
        severity: 'critical',
        redirect_link: '/import',
        action_label: 'Review',
      });
    }

    if (duplicateSlugs > 0) {
      items.push({
        id: 'duplicate_slugs',
        title: 'Duplicate Slugs',
        description: `${duplicateSlugs} car(s) share duplicate URL slugs — causes SEO conflicts`,
        count: duplicateSlugs,
        severity: 'critical',
        redirect_link: '/cars',
        action_label: 'Fix',
      });
    }

    if (staleUpcoming > 0) {
      items.push({
        id: 'stale_lifecycle',
        title: 'Stale Upcoming Cars',
        description: `${staleUpcoming} upcoming car(s) passed expected launch date without transition`,
        count: staleUpcoming,
        severity: 'warning',
        redirect_link: '/lifecycle-archive',
        action_label: 'Review',
      });
    }

    if (emptyCollections > 0) {
      items.push({
        id: 'empty_collections',
        title: 'Empty SEO Collections',
        description: `${emptyCollections} SEO collection(s) have no matching cars`,
        count: emptyCollections,
        severity: 'warning',
        redirect_link: '/seo-collection-health',
        action_label: 'Review',
      });
    }

    if (missingImages > 0) {
      items.push({
        id: 'missing_images',
        title: 'Published Cars Missing Images',
        description: `${missingImages} published car(s) have no thumbnail`,
        count: missingImages,
        severity: 'warning',
        redirect_link: '/car-images',
        action_label: 'Fix',
      });
    }

    if (missingSeo > 0) {
      items.push({
        id: 'missing_seo',
        title: 'Missing SEO Metadata',
        description: `${missingSeo} published car(s) are missing meta title or description`,
        count: missingSeo,
        severity: 'warning',
        redirect_link: '/content-health',
        action_label: 'Fix',
      });
    }

    if (weakCollections > 0) {
      items.push({
        id: 'weak_collections',
        title: 'Weak SEO Collections',
        description: `${weakCollections} collection(s) have fewer than 3 cars — low SEO value`,
        count: weakCollections,
        severity: 'info',
        redirect_link: '/seo-collection-health',
        action_label: 'Open',
      });
    }

    // Sort by severity: critical > warning > info
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return {
      items,
      total_issues: items.reduce((sum, i) => sum + i.count, 0),
      critical_count: items.filter((i) => i.severity === 'critical').reduce((s, i) => s + i.count, 0),
      warning_count: items.filter((i) => i.severity === 'warning').reduce((s, i) => s + i.count, 0),
    };
  }
}
