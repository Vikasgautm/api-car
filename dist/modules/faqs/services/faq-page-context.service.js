"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQPageContextService = void 0;
const car_model_1 = require("../../../models/car.model");
const brand_model_1 = require("../../../models/brand.model");
const body_type_model_1 = require("../../../models/body-type.model");
const fuel_type_model_1 = require("../../../models/fuel-type.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
// Page-specific FAQ count limits per spec
const PAGE_LIMITS = {
    variant_page: 8,
    variant_overview_page: 8,
    specs_page: 6,
    car_page: 12,
    car_overview_page: 12,
    comparison_page: 10,
    seo_collection_page: 14,
    brand_page: 10,
    body_type_page: 10,
    fuel_type_page: 10,
    upcoming_cars_page: 8,
    budget_page: 12,
    safety_page: 8,
    family_page: 8,
    feature_page: 8,
    homepage: 10,
    new_cars_page: 10,
};
const PAGE_FAQ_TYPES = {
    variant_page: ['specification', 'feature', 'performance', 'safety', 'dimensions', 'ownership'],
    variant_overview_page: ['specification', 'feature', 'performance', 'safety'],
    specs_page: ['specification', 'dimensions', 'performance'],
    car_page: ['editorial', 'specification', 'feature', 'performance', 'safety', 'ownership'],
    car_overview_page: ['editorial', 'specification', 'feature', 'performance', 'safety'],
    comparison_page: ['comparison', 'editorial'],
    seo_collection_page: ['collection', 'aggregation', 'editorial'],
    brand_page: ['aggregation', 'editorial', 'feature'],
    body_type_page: ['collection', 'aggregation', 'editorial'],
    fuel_type_page: ['collection', 'aggregation', 'performance', 'editorial'],
    upcoming_cars_page: ['upcoming', 'editorial'],
    budget_page: ['collection', 'editorial'],
    safety_page: ['safety', 'editorial'],
    family_page: ['specification', 'feature', 'editorial'],
    feature_page: ['feature', 'editorial'],
    homepage: ['editorial', 'collection'],
    new_cars_page: ['editorial', 'collection'],
};
class FAQPageContextService {
    static async resolvePageContext(pageType, entityType, entityId) {
        const context = {
            page_type: pageType,
            entity_type: entityType,
            entity_id: entityId,
            faq_limit: PAGE_LIMITS[pageType] ?? 10,
            applicable_faq_types: PAGE_FAQ_TYPES[pageType] ?? ['editorial'],
        };
        if (!entityId || !entityType)
            return context;
        const entityData = await FAQPageContextService.fetchEntityData(entityType, entityId);
        if (entityData) {
            context.entity_name = entityData.name;
            context.entity_data = entityData;
        }
        return context;
    }
    static async fetchEntityData(entityType, entityId) {
        try {
            switch (entityType) {
                case 'car': {
                    const car = await car_model_1.Car.findOne({ car_id: entityId, is_deleted: false })
                        .select('car_id name slug brand_id body_type_id fuel_type_id status is_upcoming is_launched')
                        .lean();
                    return car;
                }
                case 'variant': {
                    const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: entityId, is_deleted: false })
                        .select('variant_id name car_id fuel_type specs_normalized price_ex_showroom')
                        .lean();
                    return variant;
                }
                case 'brand': {
                    const brand = await brand_model_1.Brand.findOne({ brand_id: entityId, is_deleted: false })
                        .select('brand_id name slug country_of_origin')
                        .lean();
                    return brand;
                }
                case 'body_type': {
                    const bt = await body_type_model_1.BodyType.findOne({ body_type_id: entityId, is_deleted: false })
                        .select('body_type_id name slug')
                        .lean();
                    return bt;
                }
                case 'fuel_type': {
                    const ft = await fuel_type_model_1.FuelType.findOne({ fuel_type_id: entityId, is_deleted: false })
                        .select('fuel_type_id name slug')
                        .lean();
                    return ft;
                }
                default:
                    return null;
            }
        }
        catch {
            return null;
        }
    }
    static getPageLimit(pageType) {
        return PAGE_LIMITS[pageType] ?? 10;
    }
    static getApplicableFaqTypes(pageType) {
        return PAGE_FAQ_TYPES[pageType] ?? ['editorial'];
    }
}
exports.FAQPageContextService = FAQPageContextService;
//# sourceMappingURL=faq-page-context.service.js.map