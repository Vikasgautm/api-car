import { getPool, mssql } from '../../../sql/utils/dbConnection';

export interface ContentHealthSummary {
  missing_images: number;
  missing_seo: number;
  broken_slugs: number;
  orphan_variants: number;
  stale_lifecycle: number;
  low_confidence_specs: number;
  duplicate_slugs: number;
  total_issues: number;
}

export class DashboardHealthService {
  static async getSummary(): Promise<ContentHealthSummary> {
    const pool = await getPool();

    const [
      missingImagesRes,
      missingSeoRes,
      orphanVariantsRes,
      staleLifecycleRes,
      duplicateSlugsRes,
    ] = await Promise.all([
      pool.request().query(`
        SELECT COUNT(*) as cnt FROM Cars 
        WHERE is_deleted = 0 
        AND is_published = 1 
        AND (og_image IS NULL OR og_image = '')
      `),
      pool.request().query(`
        SELECT COUNT(*) as cnt FROM Cars 
        WHERE is_deleted = 0 
        AND (meta_title IS NULL OR meta_title = '' OR meta_description IS NULL OR meta_description = '')
      `),
      pool.request().query(`
        SELECT COUNT(*) as cnt FROM CarVariants 
        WHERE is_deleted = 0 
        AND (car_id IS NULL OR car_id = '')
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

    const missingImages = missingImagesRes.recordset[0].cnt || 0;
    const missingSeo = missingSeoRes.recordset[0].cnt || 0;
    const orphanVariants = orphanVariantsRes.recordset[0].cnt || 0;
    const staleLifecycle = staleLifecycleRes.recordset[0].cnt || 0;
    const duplicateSlugs = duplicateSlugsRes.recordset[0].cnt || 0;

    return {
      missing_images: missingImages,
      missing_seo: missingSeo,
      broken_slugs: duplicateSlugs,
      orphan_variants: orphanVariants,
      stale_lifecycle: staleLifecycle,
      low_confidence_specs: 0,
      duplicate_slugs: duplicateSlugs,
      total_issues: missingImages + missingSeo + duplicateSlugs + orphanVariants + staleLifecycle,
    };
  }
}
