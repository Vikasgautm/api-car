import { ISeoCollection } from '../../../models/seo-collection.model';
import { DiscoveryFilters } from '../../discovery/services/discovery.service';
export declare class SeoCollectionQueryService {
    static buildDiscoveryFilters(collection: Partial<ISeoCollection>): Promise<DiscoveryFilters>;
}
