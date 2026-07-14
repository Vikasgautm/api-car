"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_routes_1 = __importDefault(require("../../modules/dashboard/routes/dashboard.routes"));
const audit_routes_1 = __importDefault(require("../../modules/audit/routes/audit.routes"));
const content_health_routes_1 = __importDefault(require("../../modules/content-health/routes/content-health.routes"));
const seo_collections_routes_1 = __importDefault(require("../../modules/seo-collections/routes/seo-collections.routes"));
const fuel_types_intelligence_routes_1 = __importDefault(require("../../modules/fuel-types-intelligence/routes/fuel-types-intelligence.routes"));
const rankings_routes_1 = __importDefault(require("../../modules/rankings/routes/rankings.routes"));
const auth_routes_1 = __importDefault(require("../../modules/auth/routes/auth.routes"));
const comparison_routes_1 = __importDefault(require("../../modules/comparison/routes/comparison.routes"));
const deletion_workflow_routes_1 = __importDefault(require("../../modules/deletion-workflow/routes/deletion-workflow.routes"));
const discovery_routes_1 = __importDefault(require("../../modules/discovery/routes/discovery.routes"));
const seo_preset_routes_1 = __importDefault(require("../../modules/discovery/routes/seo-preset.routes"));
const blog_routes_1 = __importDefault(require("../../modules/blogs/routes/blog.routes"));
const bodyType_routes_1 = __importDefault(require("../../modules/bodyTypes/routes/bodyType.routes"));
const brand_routes_1 = __importDefault(require("../../modules/brands/routes/brand.routes"));
const car_routes_1 = __importStar(require("../../modules/cars/routes/car.routes"));
const variant_routes_1 = __importDefault(require("../../modules/cars/routes/variant.routes"));
const city_routes_1 = __importDefault(require("../../modules/cities/routes/city.routes"));
const faq_routes_1 = __importDefault(require("../../modules/faqs/routes/faq.routes"));
const fuel_type_routes_1 = __importDefault(require("../../modules/fuelTypes/routes/fuel-type.routes"));
const car_image_routes_1 = __importDefault(require("../../modules/images/routes/car-image.routes"));
const image_category_routes_1 = __importDefault(require("../../modules/images/routes/image-category.routes"));
const image_subcategory_routes_1 = __importDefault(require("../../modules/images/routes/image-subcategory.routes"));
const image_routes_1 = __importDefault(require("../../modules/images/routes/image.routes"));
const import_routes_1 = __importDefault(require("../../modules/imports/routes/import.routes"));
const intelligence_routes_1 = __importDefault(require("../../modules/intelligence/routes/intelligence.routes"));
const redirect_routes_1 = __importDefault(require("../../modules/redirects/routes/redirect.routes"));
const settings_routes_1 = __importDefault(require("../../modules/settings/routes/settings.routes"));
const taxonomy_routes_1 = __importDefault(require("../../modules/taxonomy/routes/taxonomy.routes"));
const user_routes_1 = __importDefault(require("../../modules/users/routes/user.routes"));
const governance_routes_1 = __importDefault(require("../../modules/governance/routes/governance.routes"));
const popular_collections_routes_1 = __importDefault(require("../../modules/popular-collections/routes/popular-collections.routes"));
const lifecycle_governance_routes_1 = __importDefault(require("../../modules/lifecycle-governance/routes/lifecycle-governance.routes"));
const import_staging_routes_1 = __importDefault(require("../../modules/variant-ingestion/routes/import-staging.routes"));
const master_data_routes_1 = __importDefault(require("../../modules/master-data/routes/master-data.routes"));
const master_data_public_routes_1 = __importDefault(require("../../modules/master-data/routes/master-data-public.routes"));
const adminChatbot_routes_1 = __importDefault(require("../../modules/admin-chatbot/routes/adminChatbot.routes"));
const sitemap_routes_1 = __importDefault(require("../../modules/sitemap/routes/sitemap.routes"));
const router = (0, express_1.Router)();
router.use('/dashboard', dashboard_routes_1.default);
router.use('/auth', auth_routes_1.default);
router.use('/cars', car_routes_1.default);
// Admin namespace - mount admin car routes at /admin/cars for admin endpoints
// This provides backward compatibility for /admin/cars/{id} path while preserving /cars/admin/{id}
router.use('/admin/cars', car_routes_1.adminCarRouter);
router.use('/variants', variant_routes_1.default);
router.use('/brands', brand_routes_1.default);
router.use('/body-types', bodyType_routes_1.default);
router.use('/fuel-types', fuel_type_routes_1.default);
router.use('/blogs', blog_routes_1.default);
router.use('/cities', city_routes_1.default);
router.use('/faqs', faq_routes_1.default);
router.use('/images', image_routes_1.default);
router.use('/car-images', car_image_routes_1.default);
router.use('/image-categories', image_category_routes_1.default);
router.use('/image-subcategories', image_subcategory_routes_1.default);
router.use('/imports', import_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/settings', settings_routes_1.default);
router.use('/taxonomy', taxonomy_routes_1.default);
router.use('/intelligence', intelligence_routes_1.default);
router.use('/audit', audit_routes_1.default);
router.use('/deletion-requests', deletion_workflow_routes_1.default);
router.use('/redirects', redirect_routes_1.default);
router.use('/comparisons', comparison_routes_1.default);
router.use('/discover', discovery_routes_1.default);
router.use('/discovery', discovery_routes_1.default); // Alias for /discover
router.use('/seo-presets', seo_preset_routes_1.default);
router.use('/content-health', content_health_routes_1.default);
router.use('/seo-collections', seo_collections_routes_1.default);
router.use('/fuel-types-intelligence', fuel_types_intelligence_routes_1.default);
router.use('/rankings', rankings_routes_1.default);
router.use('/governance', governance_routes_1.default);
router.use('/popular-collections', popular_collections_routes_1.default);
router.use('/admin/imports', import_staging_routes_1.default);
router.use('/lifecycle-governance', lifecycle_governance_routes_1.default);
router.use('/master-data/admin', master_data_routes_1.default);
router.use('/master-data/public', master_data_public_routes_1.default);
router.use('/chatbot', adminChatbot_routes_1.default);
router.use('/sitemap', sitemap_routes_1.default);
exports.default = router;
