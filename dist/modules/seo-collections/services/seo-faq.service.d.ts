import { ISeoFaqItem, SeoCollectionType } from '../../../models/seo-collection.model';
export declare class SeoFaqService {
    static generateFaqs(collection_type: SeoCollectionType, params: {
        fuel_type_ids?: string[];
        body_type_ids?: string[];
        budget_max?: number | null;
        transmission_types?: string[];
        mileage_classes?: string[];
    }): Promise<ISeoFaqItem[]>;
}
