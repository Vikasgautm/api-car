import { executeQueryParams, mssql } from '../../../sql/utils/dbConnection';
import { AppError } from '../../../shared/utils/app-error.util';

export class CarsService {
  /**
   * Get all cars with filters and explicit SQL JOINs (Cars, Brands, CarImages)
   */
  public async getAllCars(params: {
    page?: number;
    limit?: number;
    q?: string;
    brand?: string;
    bodyType?: string;
    fuelType?: string;
    budget?: string;
    minPrice?: number;
    maxPrice?: number;
    seating?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const pageNum = Number(params.page) || 1;
    const limitNum = Number(params.limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    const queryParams: { name: string; type: any; value: any }[] = [];
    const whereClauses: string[] = ['c.is_deleted = 0', 'c.is_published = 1'];

    if (params.q) {
      whereClauses.push('(c.name LIKE @search OR b.name LIKE @search OR c.body_type LIKE @search)');
      queryParams.push({ name: 'search', type: mssql.VarChar(), value: `%${params.q}%` });
    }

    if (params.brand) {
      whereClauses.push('(b.slug = @brand OR b.name = @brand OR c.brand_id = @brand)');
      queryParams.push({ name: 'brand', type: mssql.VarChar(), value: params.brand });
    }

    if (params.bodyType) {
      whereClauses.push('c.body_type = @bodyType');
      queryParams.push({ name: 'bodyType', type: mssql.VarChar(), value: params.bodyType });
    }

    if (params.fuelType) {
      whereClauses.push('(JSON_CONTAINS(c.fuel_types, JSON_QUOTE(@fuelType)) OR c.fuel_types LIKE @fuelTypeLike)');
      queryParams.push({ name: 'fuelType', type: mssql.VarChar(), value: params.fuelType });
      queryParams.push({ name: 'fuelTypeLike', type: mssql.VarChar(), value: `%${params.fuelType}%` });
    }

    if (params.status) {
      whereClauses.push('c.status = @status');
      queryParams.push({ name: 'status', type: mssql.VarChar(), value: params.status });
    }

    if (params.minPrice !== undefined && !isNaN(params.minPrice)) {
      whereClauses.push('CAST(JSON_UNQUOTE(JSON_EXTRACT(c.price_range, "$.min")) AS UNSIGNED) >= @minPrice');
      queryParams.push({ name: 'minPrice', type: mssql.Int(), value: params.minPrice });
    }

    if (params.maxPrice !== undefined && !isNaN(params.maxPrice)) {
      whereClauses.push('CAST(JSON_UNQUOTE(JSON_EXTRACT(c.price_range, "$.max")) AS UNSIGNED) <= @maxPrice');
      queryParams.push({ name: 'maxPrice', type: mssql.Int(), value: params.maxPrice });
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let orderBySql = 'ORDER BY c.createdAt DESC';
    if (params.sortBy === 'price_low') {
      orderBySql = 'ORDER BY CAST(JSON_UNQUOTE(JSON_EXTRACT(c.price_range, "$.min")) AS UNSIGNED) ASC';
    } else if (params.sortBy === 'price_high') {
      orderBySql = 'ORDER BY CAST(JSON_UNQUOTE(JSON_EXTRACT(c.price_range, "$.min")) AS UNSIGNED) DESC';
    } else if (params.sortBy === 'rating') {
      orderBySql = 'ORDER BY c.user_rating DESC, c.expert_rating DESC';
    }

    const baseQuery = `
      FROM Cars c
      LEFT JOIN Brands b ON c.brand_id = b.brand_id
      LEFT JOIN CarImages img ON c.car_id = img.car_id AND img.is_primary = 1 AND img.is_deleted = 0
      ${whereSql}
    `;

    const countSql = `SELECT COUNT(DISTINCT c.car_id) as total_data ${baseQuery}`;

    const dataSql = `
      SELECT 
        c.id,
        c.car_id,
        c.name,
        c.slug,
        c.short_description,
        c.description,
        c.body_type,
        c.fuel_types,
        c.price_range,
        c.key_specifications,
        c.expert_rating,
        c.user_rating,
        c.status,
        c.launch_date,
        c.meta_title,
        c.meta_description,
        c.meta_keywords,
        c.og_image,
        c.canonical_url,
        c.noindex,
        b.name as brand_name,
        b.slug as brand_slug,
        b.logo as brand_logo,
        MAX(img.url) as image_url
      ${baseQuery}
      GROUP BY 
        c.id, c.car_id, c.name, c.slug, c.short_description, c.description,
        c.body_type, c.fuel_types, c.price_range, c.key_specifications,
        c.expert_rating, c.user_rating, c.status, c.launch_date,
        c.meta_title, c.meta_description, c.meta_keywords, c.og_image,
        c.canonical_url, c.noindex, b.name, b.slug, b.logo
      ${orderBySql}
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const countResult = await executeQueryParams(countSql, queryParams);
    const dataResult = await executeQueryParams(dataSql, queryParams);

    const total = countResult.recordset?.[0]?.total_data || countResult[0]?.total_data || 0;
    const cars = dataResult.recordset || dataResult || [];

    return {
      cars,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
  }

  /**
   * Get single car detail by ID or slug with full JOINs (Brands, Variants, Images, FAQs) and SEO metadata
   */
  public async getCarByIdOrSlug(idOrSlug: string) {
    const carParams = [
      { name: 'identifier', type: mssql.VarChar(), value: idOrSlug }
    ];

    const carQuery = `
      SELECT 
        c.id,
        c.car_id,
        c.name,
        c.slug,
        c.short_description,
        c.description,
        c.body_type,
        c.fuel_types,
        c.price_range,
        c.key_specifications,
        c.expert_rating,
        c.user_rating,
        c.status,
        c.launch_date,
        c.meta_title,
        c.meta_description,
        c.meta_keywords,
        c.og_image,
        c.canonical_url,
        c.noindex,
        b.brand_id,
        b.name as brand_name,
        b.slug as brand_slug,
        b.logo as brand_logo
      FROM Cars c
      LEFT JOIN Brands b ON c.brand_id = b.brand_id
      WHERE (c.car_id = @identifier OR c.slug = @identifier OR c.id = @identifier)
        AND c.is_deleted = 0
        AND c.is_published = 1
      LIMIT 1
    `;

    const carResult = await executeQueryParams(carQuery, carParams);
    const car = carResult.recordset?.[0] || carResult?.[0];

    if (!car) {
      throw new AppError('Car not found', 404);
    }

    const subQueryParams = [
      { name: 'carId', type: mssql.VarChar(), value: car.car_id }
    ];

    // Fetch Variants with Raw Query
    const variantsQuery = `
      SELECT 
        variant_id, name, slug, price, transmission, fuel_type, 
        engine_displacement, power, torque, mileage, seating_capacity, specifications, features 
      FROM CarVariants 
      WHERE car_id = @carId AND is_deleted = 0 AND is_published = 1
      ORDER BY price ASC
    `;

    // Fetch Images with Raw Query
    const imagesQuery = `
      SELECT image_id, url, caption, is_primary, category 
      FROM CarImages 
      WHERE car_id = @carId AND is_deleted = 0
      ORDER BY is_primary DESC, id ASC
    `;

    // Fetch FAQs with Raw Query
    const faqsQuery = `
      SELECT faq_id, question, answer, category 
      FROM FAQs 
      WHERE entity_id = @carId AND entity_type = 'car' AND is_deleted = 0 AND is_published = 1
    `;

    const [variantsRes, imagesRes, faqsRes] = await Promise.all([
      executeQueryParams(variantsQuery, subQueryParams),
      executeQueryParams(imagesQuery, subQueryParams),
      executeQueryParams(faqsQuery, subQueryParams)
    ]);

    car.variants = variantsRes.recordset || variantsRes || [];
    car.images = imagesRes.recordset || imagesRes || [];
    car.faqs = faqsRes.recordset || faqsRes || [];

    return car;
  }

  /**
   * Get upcoming cars with explicit SQL JOINs
   */
  public async getUpcomingCars(params: { page?: number; limit?: number }) {
    return this.getAllCars({ ...params, status: 'upcoming' });
  }

  /**
   * Search cars with Raw SQL
   */
  public async searchCars(q: string) {
    if (!q || q.trim() === '') {
      return [];
    }

    const queryParams = [
      { name: 'search', type: mssql.VarChar(), value: `%${q.trim()}%` }
    ];

    const searchQuery = `
      SELECT 
        c.car_id,
        c.name,
        c.slug,
        c.body_type,
        c.price_range,
        b.name as brand_name,
        b.slug as brand_slug,
        img.url as image_url
      FROM Cars c
      LEFT JOIN Brands b ON c.brand_id = b.brand_id
      LEFT JOIN CarImages img ON c.car_id = img.car_id AND img.is_primary = 1 AND img.is_deleted = 0
      WHERE (c.name LIKE @search OR b.name LIKE @search)
        AND c.is_deleted = 0
        AND c.is_published = 1
      LIMIT 10
    `;

    const result = await executeQueryParams(searchQuery, queryParams);
    return result.recordset || result || [];
  }
}

export const carsService = new CarsService();
