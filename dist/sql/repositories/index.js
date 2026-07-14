"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLWorkflowItem = exports.SQLVariantSpecKey = exports.SQLTagCategory = exports.SQLTag = exports.SQLSeoSettings = exports.SQLSeoPreset = exports.SQLSeoCollection = exports.SQLRedirect = exports.SQLRankingScore = exports.SQLRankingCollectionConfig = exports.SQLPopularCollection = exports.SQLPlatformSettings = exports.SQLMileageBenchmarkOverride = exports.SQLLifecycleRequest = exports.SQLImportKeyMapping = exports.SQLImageSubcategory = exports.SQLImageCategory = exports.SQLImage = exports.SQLFuelType = exports.SQLFAQ = exports.SQLEditLock = exports.SQLDeletionRequest = exports.SQLComparisonRival = exports.SQLComparison = exports.SQLCity = exports.SQLCarImage = exports.SQLCarVariant = exports.SQLCar = exports.SQLBrand = exports.SQLBodyType = exports.SQLBlog = exports.SQLUserSession = exports.SQLUser = void 0;
const CommonModel_1 = require("../common/CommonModel");
const MongooseAdapter_1 = require("../common/MongooseAdapter");
exports.SQLUser = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('Users', 'user_id', [
    'permissions',
    'assigned_brands',
    'assigned_domains',
    'workflow_rights',
    'security',
]), 'user_id');
exports.SQLUserSession = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('UserSessions', 'session_id'), 'session_id');
exports.SQLBlog = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('Blogs', 'blog_id', [
    'tags',
    'thumbnail',
    'images',
    'stale_flags',
    'connected_cars',
    'connected_variants',
    'connected_brands',
    'connected_body_types',
    'connected_fuel_types',
    'connected_comparisons',
    'connected_collections',
]), 'blog_id');
exports.SQLBodyType = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('BodyTypes', 'type_id'), 'type_id');
exports.SQLBrand = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('Brands', 'brand_id', [
    'slug_history',
    'logo',
    'brand_media',
    'aggregates_cache',
]), 'brand_id');
exports.SQLCar = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('Cars', 'car_id', [
    'slug_history',
    'fuel_types',
    'price_range',
    'key_specifications',
    'aggregates_cache',
    'spec_keys_cache',
]), 'car_id');
exports.SQLCarVariant = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('CarVariants', 'variant_id', ['specifications', 'features']), 'variant_id');
exports.SQLCarImage = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('CarImages', 'image_id'), 'image_id');
exports.SQLCity = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('Cities', 'city_id'), 'city_id');
exports.SQLComparison = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('Comparisons', 'comparison_id', ['relatedComparisons', 'seoFAQSchema']), 'comparison_id');
exports.SQLComparisonRival = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('ComparisonRivals', 'id'), 'id');
exports.SQLDeletionRequest = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('DeletionRequests', 'request_id'), 'request_id');
exports.SQLEditLock = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('EditLocks', 'lock_id'), 'lock_id');
exports.SQLFAQ = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('FAQs', 'faq_id'), 'faq_id');
exports.SQLFuelType = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('FuelTypes', 'fuel_id'), 'fuel_id');
exports.SQLImage = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('Images', 'image_id'), 'image_id');
exports.SQLImageCategory = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('ImageCategories', 'category_id'), 'category_id');
exports.SQLImageSubcategory = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('ImageSubcategories', 'subcategory_id'), 'subcategory_id');
exports.SQLImportKeyMapping = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('ImportKeyMappings', 'mapping_id', ['transformation_rule']), 'mapping_id');
exports.SQLLifecycleRequest = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('LifecycleRequests', 'request_id', ['metadata']), 'request_id');
exports.SQLMileageBenchmarkOverride = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('MileageBenchmarkOverrides', 'override_id'), 'override_id');
exports.SQLPlatformSettings = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('PlatformSettings', 'settings_id', ['settings_data']), 'settings_id');
exports.SQLPopularCollection = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('PopularCollections', 'collection_id', [
    'filter_criteria',
    'custom_sorting',
    'aggregates_cache',
]), 'collection_id');
exports.SQLRankingCollectionConfig = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('RankingCollectionConfigs', 'config_id', [
    'score_weights',
    'signal_parameters',
]), 'config_id');
exports.SQLRankingScore = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('RankingScores', 'score_id', ['raw_signals']), 'score_id');
exports.SQLRedirect = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('Redirects', 'redirect_id'), 'redirect_id');
exports.SQLSeoCollection = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('SeoCollections', 'collection_id', ['filter_criteria']), 'collection_id');
exports.SQLSeoPreset = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('SeoPresets', 'preset_id'), 'preset_id');
exports.SQLSeoSettings = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('SeoSettings', 'settings_id', ['schema_templates']), 'settings_id');
exports.SQLTag = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('Tags', 'tag_id'), 'tag_id');
exports.SQLTagCategory = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('TagCategories', 'category_id'), 'category_id');
exports.SQLVariantSpecKey = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('VariantSpecKeys', 'spec_id', ['validation_rules']), 'spec_id');
exports.SQLWorkflowItem = new MongooseAdapter_1.MongooseAdapter(new CommonModel_1.CommonModel('WorkflowItems', 'item_id', ['history']), 'item_id');
//# sourceMappingURL=index.js.map