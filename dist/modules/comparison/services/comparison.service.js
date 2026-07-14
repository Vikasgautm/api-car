"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComparisonService = void 0;
const audit_log_model_1 = require("../../../models/audit-log.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const slug_util_1 = require("../../../shared/utils/slug.util");
const dbConnection_1 = require("../../../sql/utils/dbConnection");
const comparison_model_1 = require("../../../models/comparison.model"); // import for generating slug increment type reference
const uuid_1 = require("uuid");
async function findCarByEitherId(id) {
    if (!id)
        return null;
    const pool = await (0, dbConnection_1.getPool)();
    const result = await pool.request()
        .input('id', dbConnection_1.mssql.NVarChar, id)
        .query('SELECT TOP 1 * FROM Cars WHERE car_id = @id AND is_deleted = 0');
    if (result.recordset.length > 0) {
        return result.recordset[0];
    }
    return null;
}
// Batch-resolve car names from a set of car_ids in one query.
async function resolveCarNames(carIds) {
    const unique = Array.from(new Set(carIds.filter(Boolean)));
    if (!unique.length)
        return new Map();
    const pool = await (0, dbConnection_1.getPool)();
    const request = pool.request();
    const inParams = unique.map((id, index) => {
        const pName = `cid_${index}`;
        request.input(pName, dbConnection_1.mssql.NVarChar, id);
        return `@${pName}`;
    });
    const query = `SELECT car_id, name, generation_start_year FROM Cars WHERE car_id IN (${inParams.join(', ')})`;
    const result = await request.query(query);
    return new Map(result.recordset.map((c) => [c.car_id, { name: c.name, generation_start_year: c.generation_start_year }]));
}
class ComparisonService {
    static async createComparison(data, userId) {
        if (data.car1_id === data.car2_id) {
            throw new app_error_util_1.AppError('Cannot compare the same car', 400, {
                errorCode: 'INVALID_INPUT',
                userMessage: 'Car 1 and Car 2 cannot be the same. Please select two different cars.',
            });
        }
        const pool = await (0, dbConnection_1.getPool)();
        const transaction = new dbConnection_1.mssql.Transaction(pool);
        await transaction.begin();
        try {
            const [car1, car2] = await Promise.all([
                findCarByEitherId(data.car1_id),
                findCarByEitherId(data.car2_id),
            ]);
            if (!car1)
                throw new app_error_util_1.AppError(`Car 1 not found (id: ${data.car1_id})`, 404, { errorCode: 'CAR_NOT_FOUND' });
            if (!car2)
                throw new app_error_util_1.AppError(`Car 2 not found (id: ${data.car2_id})`, 404, { errorCode: 'CAR_NOT_FOUND' });
            // Prevent duplicate comparison for the same car pair regardless of order.
            const duplicatePair = await transaction.request()
                .input('c1', dbConnection_1.mssql.NVarChar, data.car1_id)
                .input('c2', dbConnection_1.mssql.NVarChar, data.car2_id)
                .query(`SELECT TOP 1 slug FROM Comparisons 
          WHERE is_deleted = 0 
          AND ((car1_id = @c1 AND car2_id = @c2) OR (car1_id = @c2 AND car2_id = @c1))`);
            if (duplicatePair.recordset.length > 0) {
                const dupSlug = duplicatePair.recordset[0].slug;
                throw new app_error_util_1.AppError(`Comparison between these cars already exists (slug: ${dupSlug})`, 409, {
                    errorCode: 'DUPLICATE_COMPARISON',
                    userMessage: 'A comparison between these two cars already exists.',
                    details: { existing_slug: dupSlug },
                });
            }
            // Auto-increment slug on collision instead of hard-failing.
            let slug = data.slug;
            const existingSlug = await transaction.request()
                .input('slug', dbConnection_1.mssql.NVarChar, slug)
                .query('SELECT TOP 1 comparison_id FROM Comparisons WHERE slug = @slug AND is_deleted = 0');
            if (existingSlug.recordset.length > 0) {
                slug = await (0, slug_util_1.generateSlugWithIncrement)(slug, comparison_model_1.Comparison, 'slug');
            }
            // Validate variants belong to their respective cars.
            if (data.variant1_id) {
                const variant1 = await transaction.request()
                    .input('vid', dbConnection_1.mssql.NVarChar, data.variant1_id)
                    .input('cid', dbConnection_1.mssql.NVarChar, data.car1_id)
                    .query('SELECT TOP 1 variant_id FROM CarVariants WHERE variant_id = @vid AND car_id = @cid AND is_deleted = 0');
                if (variant1.recordset.length === 0) {
                    throw new app_error_util_1.AppError('Variant 1 not found or does not belong to Car 1', 404, {
                        errorCode: 'VARIANT_NOT_FOUND',
                        userMessage: 'Selected Variant 1 does not belong to the selected Car 1.',
                    });
                }
            }
            if (data.variant2_id) {
                const variant2 = await transaction.request()
                    .input('vid', dbConnection_1.mssql.NVarChar, data.variant2_id)
                    .input('cid', dbConnection_1.mssql.NVarChar, data.car2_id)
                    .query('SELECT TOP 1 variant_id FROM CarVariants WHERE variant_id = @vid AND car_id = @cid AND is_deleted = 0');
                if (variant2.recordset.length === 0) {
                    throw new app_error_util_1.AppError('Variant 2 not found or does not belong to Car 2', 404, {
                        errorCode: 'VARIANT_NOT_FOUND',
                        userMessage: 'Selected Variant 2 does not belong to the selected Car 2.',
                    });
                }
            }
            const comparison_id = (0, uuid_1.v4)();
            const status = data.status || 'draft';
            const is_published = data.is_published ? 1 : 0;
            const isPopular = data.isPopular ? 1 : 0;
            const isTrending = data.isTrending ? 1 : 0;
            const showOnHomepage = data.showOnHomepage ? 1 : 0;
            const relatedComparisons = data.relatedComparisons ? JSON.stringify(data.relatedComparisons) : '[]';
            const seoFAQSchema = data.seoFAQSchema ? JSON.stringify(data.seoFAQSchema) : '{}';
            await transaction.request()
                .input('id', dbConnection_1.mssql.NVarChar, comparison_id)
                .input('c1', dbConnection_1.mssql.NVarChar, data.car1_id)
                .input('c2', dbConnection_1.mssql.NVarChar, data.car2_id)
                .input('v1', dbConnection_1.mssql.NVarChar, data.variant1_id || null)
                .input('v2', dbConnection_1.mssql.NVarChar, data.variant2_id || null)
                .input('slug', dbConnection_1.mssql.NVarChar, slug)
                .input('title', dbConnection_1.mssql.NVarChar, data.title)
                .input('cat', dbConnection_1.mssql.NVarChar, data.category || null)
                .input('desc', dbConnection_1.mssql.NVarChar, data.description || null)
                .input('intro', dbConnection_1.mssql.NVarChar, data.compareIntroContent || null)
                .input('pop', dbConnection_1.mssql.Bit, isPopular)
                .input('trend', dbConnection_1.mssql.Bit, isTrending)
                .input('home', dbConnection_1.mssql.Bit, showOnHomepage)
                .input('related', dbConnection_1.mssql.NVarChar, relatedComparisons)
                .input('m_title', dbConnection_1.mssql.NVarChar, data.seoMetaTitle || null)
                .input('m_desc', dbConnection_1.mssql.NVarChar, data.seoMetaDescription || null)
                .input('faq', dbConnection_1.mssql.NVarChar, seoFAQSchema)
                .input('status', dbConnection_1.mssql.NVarChar, status)
                .input('pub', dbConnection_1.mssql.Bit, is_published)
                .input('creator', dbConnection_1.mssql.NVarChar, userId)
                .query(`INSERT INTO Comparisons (
          comparison_id, car1_id, car2_id, variant1_id, variant2_id, slug, title, category, description,
          compareIntroContent, isPopular, isTrending, showOnHomepage, relatedComparisons, seoMetaTitle, seoMetaDescription,
          seoFAQSchema, status, is_published, created_by, is_deleted, createdAt, updatedAt
        ) VALUES (
          @id, @c1, @c2, @v1, @v2, @slug, @title, @cat, @desc,
          @intro, @pop, @trend, @home, @related, @m_title, @m_desc,
          @faq, @status, @pub, @creator, 0, GETDATE(), GETDATE()
        )`);
            await audit_log_model_1.AuditLog.create([{
                    audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    entity_type: 'comparison',
                    entity_id: comparison_id,
                    action: 'create',
                    actor_user_id: userId,
                    new_value: { slug, title: data.title },
                }]);
            await transaction.commit();
            const created = await pool.request()
                .input('id', dbConnection_1.mssql.NVarChar, comparison_id)
                .query('SELECT TOP 1 * FROM Comparisons WHERE comparison_id = @id');
            const row = created.recordset[0];
            return {
                ...row,
                isPopular: row.isPopular === 1 || row.isPopular === true,
                isTrending: row.isTrending === 1 || row.isTrending === true,
                showOnHomepage: row.showOnHomepage === 1 || row.showOnHomepage === true,
                is_published: row.is_published === 1 || row.is_published === true,
                relatedComparisons: row.relatedComparisons ? JSON.parse(row.relatedComparisons) : [],
                seoFAQSchema: row.seoFAQSchema ? JSON.parse(row.seoFAQSchema) : {},
            };
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    static async updateComparison(comparisonId, data, userId) {
        const pool = await (0, dbConnection_1.getPool)();
        const transaction = new dbConnection_1.mssql.Transaction(pool);
        await transaction.begin();
        try {
            const existingRes = await transaction.request()
                .input('cid', dbConnection_1.mssql.NVarChar, comparisonId)
                .query('SELECT TOP 1 * FROM Comparisons WHERE comparison_id = @cid AND is_deleted = 0');
            if (existingRes.recordset.length === 0)
                throw new app_error_util_1.AppError('Comparison not found', 404);
            const comparison = existingRes.recordset[0];
            // Check slug uniqueness if being changed
            let slug = comparison.slug;
            if (data.slug && data.slug !== comparison.slug) {
                const existingSlug = await transaction.request()
                    .input('slug', dbConnection_1.mssql.NVarChar, data.slug)
                    .query('SELECT TOP 1 comparison_id FROM Comparisons WHERE slug = @slug AND is_deleted = 0');
                if (existingSlug.recordset.length > 0) {
                    slug = await (0, slug_util_1.generateSlugWithIncrement)(data.slug, comparison_model_1.Comparison, 'slug');
                }
                else {
                    slug = data.slug;
                }
            }
            // Re-validate variants if either was changed
            const resolvedCar1Id = data.car1_id || comparison.car1_id;
            const resolvedCar2Id = data.car2_id || comparison.car2_id;
            if (data.variant1_id) {
                const variant1 = await transaction.request()
                    .input('vid', dbConnection_1.mssql.NVarChar, data.variant1_id)
                    .input('cid', dbConnection_1.mssql.NVarChar, resolvedCar1Id)
                    .query('SELECT TOP 1 variant_id FROM CarVariants WHERE variant_id = @vid AND car_id = @cid AND is_deleted = 0');
                if (variant1.recordset.length === 0) {
                    throw new app_error_util_1.AppError('Variant 1 not found or does not belong to Car 1', 404, {
                        errorCode: 'VARIANT_NOT_FOUND',
                        userMessage: 'Selected Variant 1 does not belong to the selected Car 1.',
                    });
                }
            }
            if (data.variant2_id) {
                const variant2 = await transaction.request()
                    .input('vid', dbConnection_1.mssql.NVarChar, data.variant2_id)
                    .input('cid', dbConnection_1.mssql.NVarChar, resolvedCar2Id)
                    .query('SELECT TOP 1 variant_id FROM CarVariants WHERE variant_id = @vid AND car_id = @cid AND is_deleted = 0');
                if (variant2.recordset.length === 0) {
                    throw new app_error_util_1.AppError('Variant 2 not found or does not belong to Car 2', 404, {
                        errorCode: 'VARIANT_NOT_FOUND',
                        userMessage: 'Selected Variant 2 does not belong to the selected Car 2.',
                    });
                }
            }
            const car1_id = data.car1_id !== undefined ? data.car1_id : comparison.car1_id;
            const car2_id = data.car2_id !== undefined ? data.car2_id : comparison.car2_id;
            const variant1_id = data.variant1_id !== undefined ? data.variant1_id : comparison.variant1_id;
            const variant2_id = data.variant2_id !== undefined ? data.variant2_id : comparison.variant2_id;
            const title = data.title !== undefined ? data.title : comparison.title;
            const category = data.category !== undefined ? data.category : comparison.category;
            const description = data.description !== undefined ? data.description : comparison.description;
            const compareIntroContent = data.compareIntroContent !== undefined ? data.compareIntroContent : comparison.compareIntroContent;
            const isPopular = data.isPopular !== undefined ? (data.isPopular ? 1 : 0) : comparison.isPopular;
            const isTrending = data.isTrending !== undefined ? (data.isTrending ? 1 : 0) : comparison.isTrending;
            const showOnHomepage = data.showOnHomepage !== undefined ? (data.showOnHomepage ? 1 : 0) : comparison.showOnHomepage;
            const relatedComparisons = data.relatedComparisons !== undefined ? JSON.stringify(data.relatedComparisons) : comparison.relatedComparisons;
            const seoMetaTitle = data.seoMetaTitle !== undefined ? data.seoMetaTitle : comparison.seoMetaTitle;
            const seoMetaDescription = data.seoMetaDescription !== undefined ? data.seoMetaDescription : comparison.seoMetaDescription;
            const seoFAQSchema = data.seoFAQSchema !== undefined ? JSON.stringify(data.seoFAQSchema) : comparison.seoFAQSchema;
            const status = data.status !== undefined ? data.status : comparison.status;
            const is_published = data.is_published !== undefined ? (data.is_published ? 1 : 0) : comparison.is_published;
            await transaction.request()
                .input('cid', dbConnection_1.mssql.NVarChar, comparisonId)
                .input('c1', dbConnection_1.mssql.NVarChar, car1_id)
                .input('c2', dbConnection_1.mssql.NVarChar, car2_id)
                .input('v1', dbConnection_1.mssql.NVarChar, variant1_id)
                .input('v2', dbConnection_1.mssql.NVarChar, variant2_id)
                .input('slug', dbConnection_1.mssql.NVarChar, slug)
                .input('title', dbConnection_1.mssql.NVarChar, title)
                .input('cat', dbConnection_1.mssql.NVarChar, category)
                .input('desc', dbConnection_1.mssql.NVarChar, description)
                .input('intro', dbConnection_1.mssql.NVarChar, compareIntroContent)
                .input('pop', dbConnection_1.mssql.Bit, isPopular)
                .input('trend', dbConnection_1.mssql.Bit, isTrending)
                .input('home', dbConnection_1.mssql.Bit, showOnHomepage)
                .input('related', dbConnection_1.mssql.NVarChar, relatedComparisons)
                .input('m_title', dbConnection_1.mssql.NVarChar, seoMetaTitle)
                .input('m_desc', dbConnection_1.mssql.NVarChar, seoMetaDescription)
                .input('faq', dbConnection_1.mssql.NVarChar, seoFAQSchema)
                .input('status', dbConnection_1.mssql.NVarChar, status)
                .input('pub', dbConnection_1.mssql.Bit, is_published)
                .input('upd', dbConnection_1.mssql.NVarChar, userId)
                .query(`UPDATE Comparisons SET 
          car1_id = @c1, car2_id = @c2, variant1_id = @v1, variant2_id = @v2, slug = @slug, title = @title,
          category = @cat, description = @desc, compareIntroContent = @intro, isPopular = @pop, isTrending = @trend,
          showOnHomepage = @home, relatedComparisons = @related, seoMetaTitle = @m_title, seoMetaDescription = @m_desc,
          seoFAQSchema = @faq, status = @status, is_published = @pub, updated_by = @upd, updatedAt = GETDATE()
          WHERE comparison_id = @cid AND is_deleted = 0`);
            await audit_log_model_1.AuditLog.create([{
                    audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    entity_type: 'comparison',
                    entity_id: comparisonId,
                    action: 'update',
                    actor_user_id: userId,
                    new_value: data,
                }]);
            await transaction.commit();
            const updated = await pool.request()
                .input('cid', dbConnection_1.mssql.NVarChar, comparisonId)
                .query('SELECT TOP 1 * FROM Comparisons WHERE comparison_id = @cid');
            const row = updated.recordset[0];
            return {
                ...row,
                isPopular: row.isPopular === 1 || row.isPopular === true,
                isTrending: row.isTrending === 1 || row.isTrending === true,
                showOnHomepage: row.showOnHomepage === 1 || row.showOnHomepage === true,
                is_published: row.is_published === 1 || row.is_published === true,
                relatedComparisons: row.relatedComparisons ? JSON.parse(row.relatedComparisons) : [],
                seoFAQSchema: row.seoFAQSchema ? JSON.parse(row.seoFAQSchema) : {},
            };
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    static async deleteComparison(comparisonId, userId) {
        const pool = await (0, dbConnection_1.getPool)();
        const result = await pool.request()
            .input('cid', dbConnection_1.mssql.NVarChar, comparisonId)
            .query('SELECT TOP 1 comparison_id FROM Comparisons WHERE comparison_id = @cid AND is_deleted = 0');
        if (result.recordset.length === 0)
            throw new app_error_util_1.AppError('Comparison not found', 404);
        await pool.request()
            .input('cid', dbConnection_1.mssql.NVarChar, comparisonId)
            .query(`UPDATE Comparisons SET 
        is_deleted = 1, 
        deleted_at = GETDATE(), 
        status = 'archived',
        updatedAt = GETDATE()
        WHERE comparison_id = @cid`);
        await audit_log_model_1.AuditLog.create([{
                audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                entity_type: 'comparison',
                entity_id: comparisonId,
                action: 'delete',
                actor_user_id: userId,
            }]);
    }
    static async restoreComparison(comparisonId, userId) {
        const pool = await (0, dbConnection_1.getPool)();
        const result = await pool.request()
            .input('cid', dbConnection_1.mssql.NVarChar, comparisonId)
            .query('SELECT TOP 1 * FROM Comparisons WHERE comparison_id = @cid AND is_deleted = 1');
        if (result.recordset.length === 0)
            throw new app_error_util_1.AppError('Comparison not found', 404);
        await pool.request()
            .input('cid', dbConnection_1.mssql.NVarChar, comparisonId)
            .query(`UPDATE Comparisons SET 
        is_deleted = 0, 
        deleted_at = NULL, 
        status = 'draft',
        updatedAt = GETDATE()
        WHERE comparison_id = @cid`);
        await audit_log_model_1.AuditLog.create([{
                audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                entity_type: 'comparison',
                entity_id: comparisonId,
                action: 'restore',
                actor_user_id: userId,
            }]);
        const updated = await pool.request()
            .input('cid', dbConnection_1.mssql.NVarChar, comparisonId)
            .query('SELECT TOP 1 * FROM Comparisons WHERE comparison_id = @cid');
        const row = updated.recordset[0];
        return {
            ...row,
            isPopular: row.isPopular === 1 || row.isPopular === true,
            isTrending: row.isTrending === 1 || row.isTrending === true,
            showOnHomepage: row.showOnHomepage === 1 || row.showOnHomepage === true,
            is_published: row.is_published === 1 || row.is_published === true,
            relatedComparisons: row.relatedComparisons ? JSON.parse(row.relatedComparisons) : [],
            seoFAQSchema: row.seoFAQSchema ? JSON.parse(row.seoFAQSchema) : {},
        };
    }
    static async getComparisons(page = 1, limit = 10, filter = {}) {
        const pool = await (0, dbConnection_1.getPool)();
        const request = pool.request();
        let whereClauses = ['is_deleted = @del'];
        request.input('del', dbConnection_1.mssql.Bit, filter.is_deleted ? 1 : 0);
        if (filter.search) {
            const likeVal = `%${filter.search}%`;
            request.input('search', dbConnection_1.mssql.NVarChar, likeVal);
            whereClauses.push('(title LIKE @search OR slug LIKE @search)');
        }
        if (filter.category) {
            request.input('category', dbConnection_1.mssql.NVarChar, filter.category);
            whereClauses.push('category = @category');
        }
        if (filter.status) {
            request.input('status', dbConnection_1.mssql.NVarChar, filter.status);
            whereClauses.push('status = @status');
        }
        if (filter.isPopular !== undefined) {
            request.input('isPopular', dbConnection_1.mssql.Bit, filter.isPopular ? 1 : 0);
            whereClauses.push('isPopular = @isPopular');
        }
        if (filter.isTrending !== undefined) {
            request.input('isTrending', dbConnection_1.mssql.Bit, filter.isTrending ? 1 : 0);
            whereClauses.push('isTrending = @isTrending');
        }
        const whereClauseStr = whereClauses.join(' AND ');
        // Get total count
        const countResult = await request.query(`SELECT COUNT(*) as cnt FROM Comparisons WHERE ${whereClauseStr}`);
        const total = countResult.recordset[0].cnt || 0;
        // Get paginated results
        const offset = (page - 1) * limit;
        request.input('offset', dbConnection_1.mssql.Int, offset);
        request.input('limit', dbConnection_1.mssql.Int, limit);
        const queryStr = `
      SELECT * FROM Comparisons 
      WHERE ${whereClauseStr} 
      ORDER BY createdAt DESC 
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;
        const results = await request.query(queryStr);
        const comparisons = results.recordset.map((row) => ({
            ...row,
            isPopular: row.isPopular === 1 || row.isPopular === true,
            isTrending: row.isTrending === 1 || row.isTrending === true,
            showOnHomepage: row.showOnHomepage === 1 || row.showOnHomepage === true,
            is_published: row.is_published === 1 || row.is_published === true,
            relatedComparisons: row.relatedComparisons ? JSON.parse(row.relatedComparisons) : [],
            seoFAQSchema: row.seoFAQSchema ? JSON.parse(row.seoFAQSchema) : {},
        }));
        // Batch-resolve car names in a single query — no N+1.
        const carIds = comparisons.flatMap((c) => [c.car1_id, c.car2_id]);
        const carMap = await resolveCarNames(carIds);
        const enriched = comparisons.map((c) => ({
            ...c,
            car1_name: carMap.get(c.car1_id)?.name || c.car1_id,
            car2_name: carMap.get(c.car2_id)?.name || c.car2_id,
        }));
        return {
            comparisons: enriched,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        };
    }
    static async getComparisonBySlug(slug) {
        const pool = await (0, dbConnection_1.getPool)();
        const result = await pool.request()
            .input('slug', dbConnection_1.mssql.NVarChar, slug)
            .query('SELECT TOP 1 * FROM Comparisons WHERE slug = @slug AND is_deleted = 0');
        if (result.recordset.length === 0)
            throw new app_error_util_1.AppError('Comparison not found', 404);
        const row = result.recordset[0];
        const comparison = {
            ...row,
            isPopular: row.isPopular === 1 || row.isPopular === true,
            isTrending: row.isTrending === 1 || row.isTrending === true,
            showOnHomepage: row.showOnHomepage === 1 || row.showOnHomepage === true,
            is_published: row.is_published === 1 || row.is_published === true,
            relatedComparisons: row.relatedComparisons ? JSON.parse(row.relatedComparisons) : [],
            seoFAQSchema: row.seoFAQSchema ? JSON.parse(row.seoFAQSchema) : {},
        };
        const [car1, car2] = await Promise.all([
            findCarByEitherId(comparison.car1_id),
            findCarByEitherId(comparison.car2_id),
        ]);
        return {
            ...comparison,
            car1_id: car1 || comparison.car1_id,
            car2_id: car2 || comparison.car2_id,
        };
    }
    static async getComparisonById(id) {
        const pool = await (0, dbConnection_1.getPool)();
        const result = await pool.request()
            .input('id', dbConnection_1.mssql.NVarChar, id)
            .query('SELECT TOP 1 * FROM Comparisons WHERE comparison_id = @id AND is_deleted = 0');
        if (result.recordset.length === 0)
            throw new app_error_util_1.AppError('Comparison not found', 404);
        const row = result.recordset[0];
        const comparison = {
            ...row,
            isPopular: row.isPopular === 1 || row.isPopular === true,
            isTrending: row.isTrending === 1 || row.isTrending === true,
            showOnHomepage: row.showOnHomepage === 1 || row.showOnHomepage === true,
            is_published: row.is_published === 1 || row.is_published === true,
            relatedComparisons: row.relatedComparisons ? JSON.parse(row.relatedComparisons) : [],
            seoFAQSchema: row.seoFAQSchema ? JSON.parse(row.seoFAQSchema) : {},
        };
        const [car1, car2] = await Promise.all([
            findCarByEitherId(comparison.car1_id),
            findCarByEitherId(comparison.car2_id),
        ]);
        return {
            ...comparison,
            car1_id: car1 || comparison.car1_id,
            car2_id: car2 || comparison.car2_id,
        };
    }
    // Rival Management
    static async addRival(primaryCarId, rivalCarId, userId, strength = 50) {
        if (primaryCarId === rivalCarId)
            throw new app_error_util_1.AppError('Cannot set car as its own rival', 400);
        const [car1, car2] = await Promise.all([
            findCarByEitherId(primaryCarId),
            findCarByEitherId(rivalCarId),
        ]);
        if (!car1 || !car2)
            throw new app_error_util_1.AppError('One or both cars not found', 404);
        const pool = await (0, dbConnection_1.getPool)();
        const upsertRival = async (pId, rId) => {
            const check = await pool.request()
                .input('pId', dbConnection_1.mssql.NVarChar, pId)
                .input('rId', dbConnection_1.mssql.NVarChar, rId)
                .query('SELECT rival_id FROM ComparisonRivals WHERE primary_car_id = @pId AND rival_car_id = @rId');
            if (check.recordset.length > 0) {
                await pool.request()
                    .input('pId', dbConnection_1.mssql.NVarChar, pId)
                    .input('rId', dbConnection_1.mssql.NVarChar, rId)
                    .input('strength', dbConnection_1.mssql.Int, strength)
                    .query(`UPDATE ComparisonRivals SET 
            relationship_strength = @strength, 
            manual_mapping = 1, 
            updatedAt = GETDATE() 
            WHERE primary_car_id = @pId AND rival_car_id = @rId`);
            }
            else {
                await pool.request()
                    .input('rid', dbConnection_1.mssql.NVarChar, (0, uuid_1.v4)())
                    .input('pId', dbConnection_1.mssql.NVarChar, pId)
                    .input('rId', dbConnection_1.mssql.NVarChar, rId)
                    .input('strength', dbConnection_1.mssql.Int, strength)
                    .query(`INSERT INTO ComparisonRivals (
            rival_id, primary_car_id, rival_car_id, relationship_strength, manual_mapping, createdAt, updatedAt
          ) VALUES (
            @rid, @pId, @rId, @strength, 1, GETDATE(), GETDATE()
          )`);
            }
        };
        await Promise.all([
            upsertRival(primaryCarId, rivalCarId),
            upsertRival(rivalCarId, primaryCarId),
        ]);
        await audit_log_model_1.AuditLog.create([{
                audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                entity_type: 'car',
                entity_id: primaryCarId,
                action: 'update',
                actor_user_id: userId,
                new_value: { rival_id: rivalCarId },
            }]);
    }
    static async removeRival(primaryCarId, rivalCarId, userId) {
        const pool = await (0, dbConnection_1.getPool)();
        await Promise.all([
            pool.request()
                .input('pId', dbConnection_1.mssql.NVarChar, primaryCarId)
                .input('rId', dbConnection_1.mssql.NVarChar, rivalCarId)
                .query('DELETE FROM ComparisonRivals WHERE primary_car_id = @pId AND rival_car_id = @rId'),
            pool.request()
                .input('pId', dbConnection_1.mssql.NVarChar, rivalCarId)
                .input('rId', dbConnection_1.mssql.NVarChar, primaryCarId)
                .query('DELETE FROM ComparisonRivals WHERE primary_car_id = @pId AND rival_car_id = @rId'),
        ]);
        await audit_log_model_1.AuditLog.create([{
                audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                entity_type: 'car',
                entity_id: primaryCarId,
                action: 'update',
                actor_user_id: userId,
                old_value: { rival_id: rivalCarId },
            }]);
    }
    static async getRivals(carId, limit = 10) {
        const pool = await (0, dbConnection_1.getPool)();
        const result = await pool.request()
            .input('cid', dbConnection_1.mssql.NVarChar, carId)
            .input('lim', dbConnection_1.mssql.Int, limit)
            .query(`SELECT TOP (@lim) * FROM ComparisonRivals 
        WHERE primary_car_id = @cid 
        ORDER BY relationship_strength DESC`);
        return result.recordset.map((row) => ({
            ...row,
            manual_mapping: row.manual_mapping === 1 || row.manual_mapping === true,
        }));
    }
    static async getPopularComparisons(category, limit = 10) {
        const pool = await (0, dbConnection_1.getPool)();
        const request = pool.request()
            .input('lim', dbConnection_1.mssql.Int, limit);
        let query = 'SELECT TOP (@lim) * FROM Comparisons WHERE is_published = 1 AND is_deleted = 0 AND isPopular = 1';
        if (category) {
            request.input('category', dbConnection_1.mssql.NVarChar, category);
            query += ' AND category = @category';
        }
        query += ' ORDER BY createdAt DESC';
        const result = await request.query(query);
        return result.recordset.map((row) => ({
            ...row,
            isPopular: row.isPopular === 1 || row.isPopular === true,
            isTrending: row.isTrending === 1 || row.isTrending === true,
            showOnHomepage: row.showOnHomepage === 1 || row.showOnHomepage === true,
            is_published: row.is_published === 1 || row.is_published === true,
            relatedComparisons: row.relatedComparisons ? JSON.parse(row.relatedComparisons) : [],
            seoFAQSchema: row.seoFAQSchema ? JSON.parse(row.seoFAQSchema) : {},
        }));
    }
    static async getTrendingComparisons(limit = 10) {
        const pool = await (0, dbConnection_1.getPool)();
        const result = await pool.request()
            .input('lim', dbConnection_1.mssql.Int, limit)
            .query('SELECT TOP (@lim) * FROM Comparisons WHERE is_published = 1 AND is_deleted = 0 AND isTrending = 1 ORDER BY updatedAt DESC');
        return result.recordset.map((row) => ({
            ...row,
            isPopular: row.isPopular === 1 || row.isPopular === true,
            isTrending: row.isTrending === 1 || row.isTrending === true,
            showOnHomepage: row.showOnHomepage === 1 || row.showOnHomepage === true,
            is_published: row.is_published === 1 || row.is_published === true,
            relatedComparisons: row.relatedComparisons ? JSON.parse(row.relatedComparisons) : [],
            seoFAQSchema: row.seoFAQSchema ? JSON.parse(row.seoFAQSchema) : {},
        }));
    }
    static async getComparisonsByCategory(category, page = 1, limit = 10) {
        const pool = await (0, dbConnection_1.getPool)();
        const countResult = await pool.request()
            .input('category', dbConnection_1.mssql.NVarChar, category)
            .query('SELECT COUNT(*) as cnt FROM Comparisons WHERE category = @category AND is_published = 1 AND is_deleted = 0');
        const total = countResult.recordset[0].cnt || 0;
        const offset = (page - 1) * limit;
        const result = await pool.request()
            .input('category', dbConnection_1.mssql.NVarChar, category)
            .input('offset', dbConnection_1.mssql.Int, offset)
            .input('limit', dbConnection_1.mssql.Int, limit)
            .query(`SELECT * FROM Comparisons 
        WHERE category = @category AND is_published = 1 AND is_deleted = 0 
        ORDER BY createdAt DESC 
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`);
        const comparisons = result.recordset.map((row) => ({
            ...row,
            isPopular: row.isPopular === 1 || row.isPopular === true,
            isTrending: row.isTrending === 1 || row.isTrending === true,
            showOnHomepage: row.showOnHomepage === 1 || row.showOnHomepage === true,
            is_published: row.is_published === 1 || row.is_published === true,
            relatedComparisons: row.relatedComparisons ? JSON.parse(row.relatedComparisons) : [],
            seoFAQSchema: row.seoFAQSchema ? JSON.parse(row.seoFAQSchema) : {},
        }));
        return { comparisons, total, page, limit };
    }
}
exports.ComparisonService = ComparisonService;
