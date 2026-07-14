"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardSearchService = void 0;
const dbConnection_1 = require("../../../sql/utils/dbConnection");
class DashboardSearchService {
    static async search(query, limit = 5) {
        if (!query || query.trim().length < 2) {
            return { cars: [], variants: [], seo_collections: [], comparisons: [], blogs: [], total: 0 };
        }
        const q = query.trim();
        const likeVal = `%${q}%`;
        const pool = await (0, dbConnection_1.getPool)();
        // 1. Resolve brand IDs matching the query
        const brandMatchRes = await pool.request()
            .input('likeVal', dbConnection_1.mssql.NVarChar, likeVal)
            .query('SELECT brand_id FROM Brands WHERE name LIKE @likeVal AND is_deleted = 0');
        const matchedBrandIds = brandMatchRes.recordset.map((b) => b.brand_id);
        // 2. Fetch cars matching query or brand IDs
        const fetchCars = async () => {
            const request = pool.request()
                .input('likeVal', dbConnection_1.mssql.NVarChar, likeVal)
                .input('lim', dbConnection_1.mssql.Int, limit);
            let brandFilter = '';
            if (matchedBrandIds.length > 0) {
                const inParams = matchedBrandIds.map((id, index) => {
                    const pName = `brand_${index}`;
                    request.input(pName, dbConnection_1.mssql.NVarChar, id);
                    return `@${pName}`;
                });
                brandFilter = ` OR brand_id IN (${inParams.join(', ')})`;
            }
            const queryStr = `
        SELECT TOP (@lim) car_id, name, slug, brand_id, body_type_name, status 
        FROM Cars 
        WHERE is_deleted = 0 
        AND (name LIKE @likeVal OR slug LIKE @likeVal OR body_type_name LIKE @likeVal${brandFilter})
      `;
            const res = await request.query(queryStr);
            return res.recordset;
        };
        // 3. Fetch variants
        const fetchVariants = async () => {
            return (await pool.request()
                .input('likeVal', dbConnection_1.mssql.NVarChar, likeVal)
                .input('lim', dbConnection_1.mssql.Int, limit)
                .query('SELECT TOP (@lim) variant_id, variant_name, car_id, fuel_type_id FROM CarVariants WHERE is_deleted = 0 AND (variant_name LIKE @likeVal OR slug LIKE @likeVal)')).recordset;
        };
        // 4. Fetch SEO collections
        const fetchCollections = async () => {
            return (await pool.request()
                .input('likeVal', dbConnection_1.mssql.NVarChar, likeVal)
                .input('lim', dbConnection_1.mssql.Int, limit)
                .query('SELECT TOP (@lim) collection_id, title, slug, status FROM SeoCollections WHERE is_deleted = 0 AND (title LIKE @likeVal OR slug LIKE @likeVal)')).recordset;
        };
        // 5. Fetch Comparisons
        const fetchComparisons = async () => {
            return (await pool.request()
                .input('likeVal', dbConnection_1.mssql.NVarChar, likeVal)
                .input('lim', dbConnection_1.mssql.Int, limit)
                .query('SELECT TOP (@lim) comparison_id, title, slug, status FROM Comparisons WHERE is_deleted = 0 AND (title LIKE @likeVal OR slug LIKE @likeVal)')).recordset;
        };
        // 6. Fetch Blogs
        const fetchBlogs = async () => {
            return (await pool.request()
                .input('likeVal', dbConnection_1.mssql.NVarChar, likeVal)
                .input('lim', dbConnection_1.mssql.Int, limit)
                .query('SELECT TOP (@lim) blog_id, title, slug FROM Blogs WHERE is_deleted = 0 AND (title LIKE @likeVal OR slug LIKE @likeVal)')).recordset;
        };
        const [cars, variants, collections, comparisons, blogs] = await Promise.all([
            fetchCars(),
            fetchVariants(),
            fetchCollections(),
            fetchComparisons(),
            fetchBlogs(),
        ]);
        // Enrich car results with brand name
        const brandIds = [...new Set(cars.map((c) => c.brand_id).filter(Boolean))];
        const fuelTypeIds = [...new Set(variants.map((v) => v.fuel_type_id).filter(Boolean))];
        const fetchBrandDocs = async () => {
            if (!brandIds.length)
                return [];
            const request = pool.request();
            const inParams = brandIds.map((id, index) => {
                const pName = `brnd_${index}`;
                request.input(pName, dbConnection_1.mssql.NVarChar, id);
                return `@${pName}`;
            });
            return (await request.query(`SELECT brand_id, name FROM Brands WHERE brand_id IN (${inParams.join(', ')}) AND is_deleted = 0`)).recordset;
        };
        const fetchFuelDocs = async () => {
            if (!fuelTypeIds.length)
                return [];
            const request = pool.request();
            const inParams = fuelTypeIds.map((id, index) => {
                const pName = `fuel_${index}`;
                request.input(pName, dbConnection_1.mssql.NVarChar, id);
                return `@${pName}`;
            });
            return (await request.query(`SELECT fuel_type_id, name FROM FuelTypes WHERE fuel_type_id IN (${inParams.join(', ')}) AND is_deleted = 0`)).recordset;
        };
        const [brandDocs, fuelTypeDocs] = await Promise.all([
            fetchBrandDocs(),
            fetchFuelDocs(),
        ]);
        const brandNameMap = new Map(brandDocs.map((b) => [b.brand_id, b.name]));
        const fuelNameMap = new Map(fuelTypeDocs.map((f) => [f.fuel_type_id, f.name]));
        const carResults = cars.map((c) => ({
            type: 'car',
            id: c.car_id,
            title: c.name,
            subtitle: [brandNameMap.get(c.brand_id), c.body_type_name, c.status].filter(Boolean).join(' · '),
            link: `/cars?editId=${c.car_id}`,
        }));
        const variantResults = variants.map((v) => ({
            type: 'variant',
            id: v.variant_id,
            title: v.variant_name,
            subtitle: fuelNameMap.get(v.fuel_type_id) ?? undefined,
            link: `/variants/${v.variant_id}/edit`,
        }));
        const collectionResults = collections.map((s) => ({
            type: 'seo_collection',
            id: s.collection_id,
            title: s.title,
            subtitle: s.status,
            link: `/seo-collection-editor/${s.collection_id}`,
        }));
        const comparisonResults = comparisons.map((c) => ({
            type: 'comparison',
            id: c.comparison_id,
            title: c.title,
            subtitle: c.status,
            link: `/comparison/${c.comparison_id}`,
        }));
        const blogResults = blogs.map((b) => ({
            type: 'blog',
            id: b.blog_id,
            title: b.title,
            link: `/blogs`,
        }));
        const total = carResults.length + variantResults.length + collectionResults.length + comparisonResults.length + blogResults.length;
        return {
            cars: carResults,
            variants: variantResults,
            seo_collections: collectionResults,
            comparisons: comparisonResults,
            blogs: blogResults,
            total,
        };
    }
}
exports.DashboardSearchService = DashboardSearchService;
