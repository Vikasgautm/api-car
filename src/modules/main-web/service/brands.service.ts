import { executeQueryParams, mssql } from '../../../sql/utils/dbConnection';
import { AppError } from '../../../shared/utils/app-error.util';

export class WebBrandsService {
  /**
   * Get all active brands with raw SQL
   */
  public async getAllBrands() {
    const query = `
      SELECT 
        b.id, b.brand_id, b.name, b.alias, b.slug, b.logo, b.short_description,
        b.is_featured, b.is_upcoming, b.is_discontinued,
        b.meta_title, b.meta_description, b.og_image, b.canonical_url,
        COUNT(c.car_id) as total_models
      FROM Brands b
      LEFT JOIN Cars c ON b.brand_id = c.brand_id AND c.is_deleted = 0 AND c.is_published = 1
      WHERE b.is_deleted = 0 AND b.is_published = 1
      GROUP BY b.id, b.brand_id, b.name, b.alias, b.slug, b.logo, b.short_description,
        b.is_featured, b.is_upcoming, b.is_discontinued,
        b.meta_title, b.meta_description, b.og_image, b.canonical_url
      ORDER BY b.name ASC
    `;

    const result = await executeQueryParams(query, []);
    return result.recordset || result || [];
  }

  /**
   * Get brand by slug with all cars under this brand using raw SQL JOINs
   */
  public async getBrandBySlug(slug: string) {
    const params = [{ name: 'slug', type: mssql.VarChar(), value: slug }];

    const brandQuery = `
      SELECT 
        id, brand_id, name, alias, slug, logo, short_description, description,
        founded_year, country, parent_company, website,
        is_featured, is_upcoming, is_discontinued,
        meta_title, meta_description, meta_keywords, og_image, canonical_url, noindex
      FROM Brands
      WHERE slug = @slug AND is_deleted = 0 AND is_published = 1
      LIMIT 1
    `;

    const brandRes = await executeQueryParams(brandQuery, params);
    const brand = brandRes.recordset?.[0] || brandRes?.[0];

    if (!brand) {
      throw new AppError('Brand not found', 404);
    }

    const carsParams = [{ name: 'brandId', type: mssql.VarChar(), value: brand.brand_id }];

    const carsQuery = `
      SELECT 
        c.id, c.car_id, c.name, c.slug, c.short_description, c.body_type,
        c.fuel_types, c.price_range, c.expert_rating, c.user_rating, c.status,
        img.url as image_url
      FROM Cars c
      LEFT JOIN CarImages img ON c.car_id = img.car_id AND img.is_primary = 1 AND img.is_deleted = 0
      WHERE c.brand_id = @brandId AND c.is_deleted = 0 AND c.is_published = 1
      ORDER BY c.name ASC
    `;

    const carsRes = await executeQueryParams(carsQuery, carsParams);
    brand.cars = carsRes.recordset || carsRes || [];

    return brand;
  }
}

export const webBrandsService = new WebBrandsService();
