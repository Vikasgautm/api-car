import { ISeoCollection } from '../../../models/seo-collection.model';
export declare class RelatedCollectionsService {
    static findRelated(collection: ISeoCollection, limit?: number): Promise<string[]>;
}
