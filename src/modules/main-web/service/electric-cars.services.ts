import { executeQueryParams, mssql } from '../../../sql/utils/dbConnection';

class ElectricCarsModalService {
  private data: any;

  constructor(data: any) {
    this.data = data;
  }

  /**
   * Get electric cars using raw SQL query with explicit JOINs and parameterization
   */
  public getAllElectricCars = async () => {
    const { page, limit, range, budget, brand, bodyType, seating, q, sort } = this.data;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    const queryParams: { name: string; type: any; value: any }[] = [];
    const whereClauses: string[] = [
      'c.is_deleted = 0',
      'c.is_published = 1',
      '(JSON_CONTAINS(c.fuel_types, \'"Electric"\') OR c.fuel_types LIKE \'%Electric%\')'
    ];

    if (q) {
      whereClauses.push('(c.name LIKE @q OR b.name LIKE @q)');
      queryParams.push({ name: 'q', type: mssql.VarChar(), value: `%${q}%` });
    }

    if (brand) {
      whereClauses.push('(b.slug = @brand OR b.name = @brand OR c.brand_id = @brand)');
      queryParams.push({ name: 'brand', type: mssql.VarChar(), value: brand });
    }

    if (bodyType) {
      whereClauses.push('c.body_type = @bodyType');
      queryParams.push({ name: 'bodyType', type: mssql.VarChar(), value: bodyType });
    }

    if (seating) {
      whereClauses.push('JSON_UNQUOTE(JSON_EXTRACT(c.key_specifications, "$.seating")) = @seating');
      queryParams.push({ name: 'seating', type: mssql.VarChar(), value: String(seating) });
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    let orderBySql = 'ORDER BY c.user_rating DESC, c.expert_rating DESC';
    if (sort === 'price_low') {
      orderBySql = 'ORDER BY CAST(JSON_UNQUOTE(JSON_EXTRACT(c.price_range, "$.min")) AS UNSIGNED) ASC';
    } else if (sort === 'price_high') {
      orderBySql = 'ORDER BY CAST(JSON_UNQUOTE(JSON_EXTRACT(c.price_range, "$.min")) AS UNSIGNED) DESC';
    } else if (sort === 'rating') {
      orderBySql = 'ORDER BY c.user_rating DESC';
    }

    const baseJoinQuery = `
      FROM Cars c
      LEFT JOIN Brands b ON c.brand_id = b.brand_id
      LEFT JOIN CarImages img ON c.car_id = img.car_id AND img.is_primary = 1 AND img.is_deleted = 0
      ${whereSql}
    `;

    const countSql = `SELECT COUNT(DISTINCT c.car_id) as total_data ${baseJoinQuery}`;

    const dataSql = `
      SELECT 
        c.id,
        c.car_id,
        c.name,
        c.slug,
        c.short_description,
        c.body_type,
        c.fuel_types,
        c.price_range,
        c.key_specifications,
        c.expert_rating,
        c.user_rating,
        c.meta_title,
        c.meta_description,
        c.meta_keywords,
        c.og_image,
        c.canonical_url,
        b.name as brand_name,
        b.slug as brand_slug,
        b.logo as brand_logo,
        MAX(img.url) as image_url
      ${baseJoinQuery}
      GROUP BY 
        c.id, c.car_id, c.name, c.slug, c.short_description, c.body_type,
        c.fuel_types, c.price_range, c.key_specifications, c.expert_rating,
        c.user_rating, c.meta_title, c.meta_description, c.meta_keywords,
        c.og_image, c.canonical_url, b.name, b.slug, b.logo
      ${orderBySql}
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const countResult = await executeQueryParams(countSql, queryParams);
    const dataResult = await executeQueryParams(dataSql, queryParams);

    const total = countResult.recordset?.[0]?.total_data || countResult?.[0]?.total_data || 0;
    const cars = dataResult.recordset || dataResult || [];

    return {
      cars,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
  };
}

export default ElectricCarsModalService;