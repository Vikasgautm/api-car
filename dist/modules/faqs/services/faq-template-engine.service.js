"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQTemplateEngineService = void 0;
const car_model_1 = require("../../../models/car.model");
const brand_model_1 = require("../../../models/brand.model");
const fuel_type_model_1 = require("../../../models/fuel-type.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
const automotive_templates_1 = require("../templates/automotive-templates");
const CURRENT_YEAR = new Date().getFullYear();
class FAQTemplateEngineService {
    static async generateVariantFAQs(variantId) {
        const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: variantId, is_deleted: false })
            .select('variant_id name car_id fuel_type specs_normalized price_ex_showroom price_on_road_delhi')
            .lean();
        if (!variant)
            return [];
        const car = await car_model_1.Car.findOne({ car_id: variant.car_id, is_deleted: false })
            .select('name slug status is_upcoming')
            .lean();
        const variantName = `${car?.name ?? ''} ${variant.name}`.trim();
        const specs = variant.specs_normalized ?? {};
        const engine = specs.engine_performance ?? {};
        const mileageRange = specs.mileage_range ?? {};
        const battery = specs.battery_charging ?? {};
        const dimensions = specs.dimensions_capacity ?? {};
        const safetyFeatures = specs.safety_features ?? {};
        const fuelType = variant.fuel_type ?? 'Petrol';
        const isEV = typeof fuelType === 'string' && fuelType.toLowerCase().includes('electric');
        const isUpcoming = car?.is_upcoming === true;
        const vars = {
            variant_name: variantName,
            car_name: car?.name ?? variantName,
            fuel_type: fuelType,
            engine_cc: engine.displacement ?? 'N/A',
            cylinders: String(engine.cylinders ?? 'N/A'),
            max_power: engine.max_power ?? 'N/A',
            max_torque: engine.max_torque ?? 'N/A',
            transmission: engine.gearbox ?? 'N/A',
            mileage: mileageRange.arai_mileage ?? 'N/A',
            city_mileage: mileageRange.city_mileage ?? 'N/A',
            highway_mileage: mileageRange.highway_mileage ?? 'N/A',
            electric_range: battery.electric_range ?? 'N/A',
            battery_capacity: battery.battery_capacity_kwh ? String(battery.battery_capacity_kwh) : 'N/A',
            ac_charging_time: battery.ac_charging_time ?? battery.charging_time ?? 'N/A',
            fast_charge_80: battery.fast_charge_0_80 ?? battery.dc_fast_charging_time ?? 'N/A',
            charging_options: Array.isArray(battery.charging_options)
                ? battery.charging_options.join(', ')
                : 'AC and DC charging',
            top_speed: engine.top_speed ?? 'N/A',
            acceleration: engine.acceleration_0_100 ?? 'N/A',
            length: dimensions.length ?? 'N/A',
            width: dimensions.width ?? 'N/A',
            height: dimensions.height ?? 'N/A',
            wheelbase: dimensions.wheelbase ?? 'N/A',
            boot_space: dimensions.boot_space ?? 'N/A',
            seating_capacity: String(dimensions.seating_capacity ?? 5),
            seating_desc: (dimensions.seating_capacity ?? 5) >= 7
                ? 'a spacious 3-row family vehicle'
                : 'comfortable for a family of 5',
            airbag_count: String(safetyFeatures.number_of_airbags ?? safetyFeatures.airbags ?? 6),
            ncap_info: safetyFeatures.global_ncap_rating
                ? `It has received a ${safetyFeatures.global_ncap_rating}-star Global NCAP rating.`
                : '',
            ncap_stars: safetyFeatures.global_ncap_rating ?? 'N/A',
            ncap_body: 'Global NCAP',
            safety_features: [
                safetyFeatures.abs ? 'ABS' : '',
                safetyFeatures.esp ? 'ESP' : '',
                safetyFeatures.traction_control ? 'Traction Control' : '',
            ]
                .filter(Boolean)
                .join(', ') || 'multiple safety systems',
            adas_availability: safetyFeatures.forward_collision_warning ? 'comes equipped with ADAS' : 'does not offer ADAS',
            adas_features_desc: safetyFeatures.forward_collision_warning
                ? 'ADAS features include forward collision warning, lane departure warning, and adaptive cruise control.'
                : 'Basic safety features like ABS and airbags are provided.',
        };
        const templates = isEV
            ? automotive_templates_1.AUTOMOTIVE_FAQ_TEMPLATES.filter((t) => t.entity_types.includes('variant') &&
                ['specification', 'performance', 'feature', 'safety', 'dimensions', 'ownership'].includes(t.faq_type))
            : automotive_templates_1.AUTOMOTIVE_FAQ_TEMPLATES.filter((t) => t.entity_types.includes('variant') &&
                t.key !== 'ev_range' &&
                t.key !== 'variant_charging' &&
                ['specification', 'performance', 'feature', 'safety', 'dimensions', 'ownership'].includes(t.faq_type));
        return templates
            .filter((t) => !isUpcoming || t.faq_type !== 'specification')
            .map((t) => FAQTemplateEngineService.buildFAQ(t, vars, 'variant', variantId));
    }
    static async generateCarFAQs(carId) {
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false })
            .select('car_id name slug brand_id status is_upcoming')
            .lean();
        if (!car)
            return [];
        const carObj = car;
        const isUpcoming = carObj.is_upcoming === true;
        const vars = {
            car_name: carObj.name,
            expected_launch_period: 'in the upcoming months',
            expected_price: 'to be announced',
            expected_specs: 'a modern powertrain with connected car features',
            launch_detail: 'Stay tuned to CarSalahakar for official launch updates.',
            price_detail: 'Pricing will be confirmed at launch.',
            maintenance_desc: 'reasonable',
            service_interval: '10,000',
            service_months: '12',
            resale_desc: 'good',
            resale_summary: 'strong demand in the used car market.',
        };
        const templates = isUpcoming
            ? automotive_templates_1.AUTOMOTIVE_FAQ_TEMPLATES.filter((t) => t.entity_types.includes('car') && t.faq_type === 'upcoming')
            : automotive_templates_1.AUTOMOTIVE_FAQ_TEMPLATES.filter((t) => t.entity_types.includes('car') && ['safety', 'ownership', 'aggregation'].includes(t.faq_type));
        return templates.map((t) => FAQTemplateEngineService.buildFAQ(t, vars, 'car', carId));
    }
    static async generateBrandFAQs(brandId) {
        const brand = await brand_model_1.Brand.findOne({ brand_id: brandId, is_deleted: false })
            .select('brand_id name country_of_origin')
            .lean();
        if (!brand)
            return [];
        const brandObj = brand;
        const [cars] = await Promise.allSettled([
            car_model_1.Car.find({ brand_id: brandId, is_launched: true, is_deleted: false })
                .select('name')
                .limit(5)
                .lean(),
        ]);
        const carNames = cars.status === 'fulfilled'
            ? cars.value.map((c) => c.name).join(', ')
            : 'various models';
        const vars = {
            brand_name: brandObj.name,
            popular_cars: carNames,
            brand_strength: 'reliability, value for money, and after-sales service',
            min_price: '₹5 lakh',
            max_price: '₹50 lakh',
            segment_range: 'entry-level hatchbacks to premium SUVs',
            ev_models: 'multiple EV models',
            ev_min_price: '₹10 lakh',
            ev_range_summary: '300–600 km',
            year: String(CURRENT_YEAR),
        };
        const templates = automotive_templates_1.AUTOMOTIVE_FAQ_TEMPLATES.filter((t) => t.entity_types.includes('brand'));
        return templates.map((t) => FAQTemplateEngineService.buildFAQ(t, vars, 'brand', brandId));
    }
    static async generateFuelTypeFAQs(fuelTypeId) {
        const ft = await fuel_type_model_1.FuelType.findOne({ fuel_type_id: fuelTypeId, is_deleted: false })
            .select('fuel_type_id name')
            .lean();
        if (!ft)
            return [];
        const ftObj = ft;
        const vars = {
            fuel_type: ftObj.name,
            top_cars: 'multiple popular models',
            fuel_type_advantage: `${ftObj.name} vehicles offer distinct advantages for different driving needs.`,
            year: String(CURRENT_YEAR),
            collection_label: `${ftObj.name} cars`,
            collection_strength: 'efficiency and performance',
        };
        const templates = automotive_templates_1.AUTOMOTIVE_FAQ_TEMPLATES.filter((t) => t.entity_types.includes('fuel_type'));
        return templates.map((t) => FAQTemplateEngineService.buildFAQ(t, vars, 'fuel_type', fuelTypeId));
    }
    static async generateComparisonFAQs(carIds) {
        if (carIds.length < 2)
            return [];
        const cars = await car_model_1.Car.find({ car_id: { $in: carIds }, is_deleted: false })
            .select('car_id name')
            .lean();
        const carMap = new Map(cars.map((c) => [c.car_id, c.name]));
        const car1Name = carMap.get(carIds[0]) ?? 'Car 1';
        const car2Name = carMap.get(carIds[1]) ?? 'Car 2';
        const vars = {
            car1_name: car1Name,
            car2_name: car2Name,
            car1_advantage: 'features and value for money',
            car2_advantage: 'performance and technology',
            car1_recommendation: 'you prioritise practicality and budget',
            car2_recommendation: 'you want a more feature-rich experience',
            car1_price: 'competitive pricing',
            car2_price: 'competitive pricing',
            price_diff: 'varies by variant',
            car1_mileage: 'good mileage',
            car2_mileage: 'good mileage',
            mileage_winner: car1Name,
        };
        const templates = automotive_templates_1.AUTOMOTIVE_FAQ_TEMPLATES.filter((t) => t.entity_types.includes('comparison'));
        return templates.map((t) => FAQTemplateEngineService.buildFAQ(t, vars, 'comparison', carIds.join('_vs_')));
    }
    static async generateCollectionFAQs(params) {
        const vars = {
            collection_label: params.collection_label,
            body_type: params.body_type ?? 'car',
            fuel_type: params.fuel_type ?? '',
            budget_label: params.budget_label ?? 'your budget',
            budget_cars: params.top_car_names?.slice(0, 4).join(', ') ?? 'multiple popular models',
            top_cars: params.top_car_names?.slice(0, 5).join(', ') ?? 'multiple popular models',
            collection_strength: 'performance, reliability, and value',
            common_features: 'touchscreen infotainment, rearview camera, and airbags',
            year: String(CURRENT_YEAR),
        };
        const templates = automotive_templates_1.AUTOMOTIVE_FAQ_TEMPLATES.filter((t) => t.entity_types.includes('seo_collection'));
        return templates.map((t) => FAQTemplateEngineService.buildFAQ(t, vars, 'seo_collection', params.collection_label));
    }
    static renderTemplate(templateKey, variables) {
        const template = automotive_templates_1.TEMPLATE_MAP.get(templateKey);
        if (!template)
            return null;
        return {
            question: (0, automotive_templates_1.interpolate)(template.question_template, variables),
            answer: (0, automotive_templates_1.interpolate)(template.answer_template, variables),
        };
    }
    static getTemplatesForPage(pageType) {
        return (0, automotive_templates_1.getTemplatesForPageType)(pageType);
    }
    static getTemplatesForEntity(entityType) {
        return (0, automotive_templates_1.getTemplatesForEntityType)(entityType);
    }
    static getAllTemplates() {
        return automotive_templates_1.AUTOMOTIVE_FAQ_TEMPLATES;
    }
    static buildFAQ(template, vars, entityType, entityId) {
        return {
            question: (0, automotive_templates_1.interpolate)(template.question_template, vars),
            answer: (0, automotive_templates_1.interpolate)(template.answer_template, vars),
            faq_type: template.faq_type,
            intent_type: template.intent_type,
            template_key: template.key,
            entity_type: entityType,
            entity_id: entityId,
            is_dynamic: true,
            source_type: 'template',
            priority_score: template.priority,
            schema_enabled: true,
            indexable: true,
        };
    }
}
exports.FAQTemplateEngineService = FAQTemplateEngineService;
//# sourceMappingURL=faq-template-engine.service.js.map