import { executeQueryParams, mssql } from '../../../sql/utils/dbConnection';
import { AppError } from '../../../shared/utils/app-error.util';

export class WebBlogsService {
  /**
   * Get all published blogs / news with raw SQL query
   */
  public async getBlogs(params: { page?: number; limit?: number; category?: string; search?: string }) {
    const pageNum = Number(params.page) || 1;
    const limitNum = Number(params.limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    const queryParams: { name: string; type: any; value: any }[] = [];
    const whereClauses: string[] = ['is_deleted = 0', 'is_published = 1'];

    if (params.search) {
      whereClauses.push('(title LIKE @search OR excerpt LIKE @search)');
      queryParams.push({ name: 'search', type: mssql.VarChar(), value: `%${params.search}%` });
    }

    if (params.category) {
      whereClauses.push('category = @category');
      queryParams.push({ name: 'category', type: mssql.VarChar(), value: params.category });
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const countSql = `SELECT COUNT(*) as total_data FROM Blogs ${whereSql}`;
    const dataSql = `
      SELECT 
        blog_id, title, slug, excerpt, author_name, category, tags, thumbnail, link,
        createdAt, meta_title, meta_description, og_image, canonical_url
      FROM Blogs
      ${whereSql}
      ORDER BY createdAt DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const [countRes, dataRes] = await Promise.all([
      executeQueryParams(countSql, queryParams),
      executeQueryParams(dataSql, queryParams)
    ]);

    const total = countRes.recordset?.[0]?.total_data || countRes?.[0]?.total_data || 0;
    const blogs = dataRes.recordset || dataRes || [];

    return {
      blogs,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
  }

  /**
   * Get blog detail by slug or ID with raw SQL query
   */
  public async getBlogBySlugOrId(idOrSlug: string) {
    const params = [{ name: 'identifier', type: mssql.VarChar(), value: idOrSlug }];

    const query = `
      SELECT 
        blog_id, title, slug, excerpt, content, author_name, category, tags, thumbnail, images, link,
        meta_title, meta_description, meta_keywords, og_image, canonical_url, noindex, createdAt
      FROM Blogs
      WHERE (blog_id = @identifier OR slug = @identifier OR id = @identifier)
        AND is_deleted = 0 AND is_published = 1
      LIMIT 1
    `;

    const res = await executeQueryParams(query, params);
    const blog = res.recordset?.[0] || res?.[0];

    if (!blog) {
      throw new AppError('Blog article not found', 404);
    }

    return blog;
  }
}

export const webBlogsService = new WebBlogsService();
