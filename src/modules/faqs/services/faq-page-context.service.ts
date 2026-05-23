import { Car } from '../../../models/car.model';
import { Brand } from '../../../models/brand.model';
import { BodyType } from '../../../models/body-type.model';
import { FuelType } from '../../../models/fuel-type.model';
import { CarVariant } from '../../../models/car-variant.model';
import { FAQPageType } from '../../../models/faq.model';

export interface PageContext {
  page_type: FAQPageType;
  entity_type?: string;
  entity_id?: string;
  entity_name?: string;
  entity_data?: Record<string, any>;
  faq_limit: number;
  applicable_faq_types: string[];
}

// Page-specific FAQ count limits per spec
const PAGE_LIMITS: Record<string, number> = {
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

const PAGE_FAQ_TYPES: Record<string, string[]> = {
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

export class FAQPageContextService {
  static async resolvePageContext(
    pageType: FAQPageType,
    entityType?: string,
    entityId?: string,
  ): Promise<PageContext> {
    const context: PageContext = {
      page_type: pageType,
      entity_type: entityType,
      entity_id: entityId,
      faq_limit: PAGE_LIMITS[pageType] ?? 10,
      applicable_faq_types: PAGE_FAQ_TYPES[pageType] ?? ['editorial'],
    };

    if (!entityId || !entityType) return context;

    const entityData = await FAQPageContextService.fetchEntityData(entityType, entityId);
    if (entityData) {
      context.entity_name = entityData.name;
      context.entity_data = entityData;
    }

    return context;
  }

  static async fetchEntityData(
    entityType: string,
    entityId: string,
  ): Promise<Record<string, any> | null> {
    try {
      switch (entityType) {
        case 'car': {
          const car = await Car.findOne({ car_id: entityId, is_deleted: false })
            .select('car_id name slug brand_id body_type_id fuel_type_id status is_upcoming is_launched')
            .lean();
          return car as Record<string, any> | null;
        }
        case 'variant': {
          const variant = await CarVariant.findOne({ variant_id: entityId, is_deleted: false })
            .select('variant_id name car_id fuel_type specs_normalized price_ex_showroom')
            .lean();
          return variant as Record<string, any> | null;
        }
        case 'brand': {
          const brand = await Brand.findOne({ brand_id: entityId, is_deleted: false })
            .select('brand_id name slug country_of_origin')
            .lean();
          return brand as Record<string, any> | null;
        }
        case 'body_type': {
          const bt = await BodyType.findOne({ body_type_id: entityId, is_deleted: false })
            .select('body_type_id name slug')
            .lean();
          return bt as Record<string, any> | null;
        }
        case 'fuel_type': {
          const ft = await FuelType.findOne({ fuel_type_id: entityId, is_deleted: false })
            .select('fuel_type_id name slug')
            .lean();
          return ft as Record<string, any> | null;
        }
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  static getPageLimit(pageType: string): number {
    return PAGE_LIMITS[pageType] ?? 10;
  }

  static getApplicableFaqTypes(pageType: string): string[] {
    return PAGE_FAQ_TYPES[pageType] ?? ['editorial'];
  }
}
