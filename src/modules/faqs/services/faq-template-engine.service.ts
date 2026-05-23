import { Car } from '../../../models/car.model';
import { Brand } from '../../../models/brand.model';
import { FuelType } from '../../../models/fuel-type.model';
import { CarVariant } from '../../../models/car-variant.model';
import {
  AUTOMOTIVE_FAQ_TEMPLATES,
  FAQTemplate,
  TEMPLATE_MAP,
  getTemplatesForEntityType,
  getTemplatesForPageType,
  interpolate,
} from '../templates/automotive-templates';

export interface GeneratedFAQ {
  question: string;
  answer: string;
  faq_type: string;
  intent_type: string;
  template_key: string;
  entity_type: string;
  entity_id: string;
  is_dynamic: true;
  source_type: 'template';
  priority_score: number;
  schema_enabled: boolean;
  indexable: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();

export class FAQTemplateEngineService {
  static async generateVariantFAQs(variantId: string): Promise<GeneratedFAQ[]> {
    const variant = await CarVariant.findOne({ variant_id: variantId, is_deleted: false })
      .select('variant_id name car_id fuel_type specs_normalized price_ex_showroom price_on_road_delhi')
      .lean();

    if (!variant) return [];

    const car = await Car.findOne({ car_id: (variant as any).car_id, is_deleted: false })
      .select('name slug status is_upcoming')
      .lean();

    const variantName = `${(car as any)?.name ?? ''} ${(variant as any).name}`.trim();
    const specs = (variant as any).specs_normalized ?? {};
    const engine = specs.engine_performance ?? {};
    const mileageRange = specs.mileage_range ?? {};
    const battery = specs.battery_charging ?? {};
    const dimensions = specs.dimensions_capacity ?? {};
    const safetyFeatures = specs.safety_features ?? {};

    const fuelType = (variant as any).fuel_type ?? 'Petrol';
    const isEV = typeof fuelType === 'string' && fuelType.toLowerCase().includes('electric');
    const isUpcoming = (car as any)?.is_upcoming === true;

    const vars: Record<string, string> = {
      variant_name: variantName,
      car_name: (car as any)?.name ?? variantName,
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
      seating_desc:
        (dimensions.seating_capacity ?? 5) >= 7
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
      ? AUTOMOTIVE_FAQ_TEMPLATES.filter((t) =>
          t.entity_types.includes('variant') &&
          ['specification', 'performance', 'feature', 'safety', 'dimensions', 'ownership'].includes(t.faq_type)
        )
      : AUTOMOTIVE_FAQ_TEMPLATES.filter((t) =>
          t.entity_types.includes('variant') &&
          t.key !== 'ev_range' &&
          t.key !== 'variant_charging' &&
          ['specification', 'performance', 'feature', 'safety', 'dimensions', 'ownership'].includes(t.faq_type)
        );

    return templates
      .filter((t) => !isUpcoming || t.faq_type !== 'specification')
      .map((t) => FAQTemplateEngineService.buildFAQ(t, vars, 'variant', variantId));
  }

  static async generateCarFAQs(carId: string): Promise<GeneratedFAQ[]> {
    const car = await Car.findOne({ car_id: carId, is_deleted: false })
      .select('car_id name slug brand_id status is_upcoming')
      .lean();

    if (!car) return [];

    const carObj = car as any;
    const isUpcoming = carObj.is_upcoming === true;

    const vars: Record<string, string> = {
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
      ? AUTOMOTIVE_FAQ_TEMPLATES.filter(
          (t) => t.entity_types.includes('car') && t.faq_type === 'upcoming'
        )
      : AUTOMOTIVE_FAQ_TEMPLATES.filter(
          (t) => t.entity_types.includes('car') && ['safety', 'ownership', 'aggregation'].includes(t.faq_type)
        );

    return templates.map((t) => FAQTemplateEngineService.buildFAQ(t, vars, 'car', carId));
  }

  static async generateBrandFAQs(brandId: string): Promise<GeneratedFAQ[]> {
    const brand = await Brand.findOne({ brand_id: brandId, is_deleted: false })
      .select('brand_id name country_of_origin')
      .lean();

    if (!brand) return [];

    const brandObj = brand as any;

    const [cars] = await Promise.allSettled([
      Car.find({ brand_id: brandId, is_launched: true, is_deleted: false })
        .select('name')
        .limit(5)
        .lean(),
    ]);

    const carNames =
      cars.status === 'fulfilled'
        ? (cars.value as any[]).map((c: any) => c.name).join(', ')
        : 'various models';

    const vars: Record<string, string> = {
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

    const templates = AUTOMOTIVE_FAQ_TEMPLATES.filter((t) => t.entity_types.includes('brand'));
    return templates.map((t) => FAQTemplateEngineService.buildFAQ(t, vars, 'brand', brandId));
  }

  static async generateFuelTypeFAQs(fuelTypeId: string): Promise<GeneratedFAQ[]> {
    const ft = await FuelType.findOne({ fuel_type_id: fuelTypeId, is_deleted: false })
      .select('fuel_type_id name')
      .lean();

    if (!ft) return [];

    const ftObj = ft as any;
    const vars: Record<string, string> = {
      fuel_type: ftObj.name,
      top_cars: 'multiple popular models',
      fuel_type_advantage: `${ftObj.name} vehicles offer distinct advantages for different driving needs.`,
      year: String(CURRENT_YEAR),
      collection_label: `${ftObj.name} cars`,
      collection_strength: 'efficiency and performance',
    };

    const templates = AUTOMOTIVE_FAQ_TEMPLATES.filter((t) => t.entity_types.includes('fuel_type'));
    return templates.map((t) => FAQTemplateEngineService.buildFAQ(t, vars, 'fuel_type', fuelTypeId));
  }

  static async generateComparisonFAQs(
    carIds: string[],
  ): Promise<GeneratedFAQ[]> {
    if (carIds.length < 2) return [];

    const cars = await Car.find({ car_id: { $in: carIds }, is_deleted: false })
      .select('car_id name')
      .lean();

    const carMap = new Map((cars as any[]).map((c: any) => [c.car_id, c.name]));
    const car1Name = carMap.get(carIds[0]) ?? 'Car 1';
    const car2Name = carMap.get(carIds[1]) ?? 'Car 2';

    const vars: Record<string, string> = {
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

    const templates = AUTOMOTIVE_FAQ_TEMPLATES.filter((t) => t.entity_types.includes('comparison'));
    return templates.map((t) =>
      FAQTemplateEngineService.buildFAQ(t, vars, 'comparison', carIds.join('_vs_'))
    );
  }

  static async generateCollectionFAQs(params: {
    collection_label: string;
    body_type?: string;
    fuel_type?: string;
    budget_label?: string;
    top_car_names?: string[];
  }): Promise<GeneratedFAQ[]> {
    const vars: Record<string, string> = {
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

    const templates = AUTOMOTIVE_FAQ_TEMPLATES.filter((t) => t.entity_types.includes('seo_collection'));
    return templates.map((t) =>
      FAQTemplateEngineService.buildFAQ(t, vars, 'seo_collection', params.collection_label)
    );
  }

  static renderTemplate(templateKey: string, variables: Record<string, string>): { question: string; answer: string } | null {
    const template = TEMPLATE_MAP.get(templateKey);
    if (!template) return null;
    return {
      question: interpolate(template.question_template, variables),
      answer: interpolate(template.answer_template, variables),
    };
  }

  static getTemplatesForPage(pageType: string): FAQTemplate[] {
    return getTemplatesForPageType(pageType);
  }

  static getTemplatesForEntity(entityType: string): FAQTemplate[] {
    return getTemplatesForEntityType(entityType);
  }

  static getAllTemplates(): FAQTemplate[] {
    return AUTOMOTIVE_FAQ_TEMPLATES;
  }

  private static buildFAQ(
    template: FAQTemplate,
    vars: Record<string, string>,
    entityType: string,
    entityId: string,
  ): GeneratedFAQ {
    return {
      question: interpolate(template.question_template, vars),
      answer: interpolate(template.answer_template, vars),
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
