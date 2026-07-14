import { IPopularCollection } from '../../../models/popular-collection.model';
export declare class PopularCollectionService {
    static list(status?: string): Promise<(IPopularCollection & import("../../../sql/common/BaseModel").SQLDocument)[]>;
    static getBySlug(slug: string): Promise<IPopularCollection & import("../../../sql/common/BaseModel").SQLDocument>;
    static getById(collection_id: string): Promise<IPopularCollection & import("../../../sql/common/BaseModel").SQLDocument>;
    static create(data: Partial<IPopularCollection>, userId?: string): Promise<any>;
    static update(collection_id: string, data: Partial<IPopularCollection>, userId?: string): Promise<IPopularCollection & import("../../../sql/common/BaseModel").SQLDocument>;
    static remove(collection_id: string): Promise<any>;
    static updateCarOrdering(collection_id: string, payload: {
        pinned_car_ids?: string[];
        manual_car_ids?: string[];
        suppressed_car_ids?: string[];
    }, userId?: string): Promise<IPopularCollection & import("../../../sql/common/BaseModel").SQLDocument>;
    static updateRenderingMode(collection_id: string, payload: {
        rendering_mode: string;
        manual_weight?: number;
        behavioral_weight?: number;
        min_behavioral_confidence?: number;
    }, userId?: string): Promise<IPopularCollection & import("../../../sql/common/BaseModel").SQLDocument>;
    static publish(collection_id: string, userId?: string): Promise<IPopularCollection & import("../../../sql/common/BaseModel").SQLDocument>;
    static archive(collection_id: string, userId?: string): Promise<IPopularCollection & import("../../../sql/common/BaseModel").SQLDocument>;
    static reorderHubSections(orderedIds: string[], userId?: string): Promise<void>;
}
