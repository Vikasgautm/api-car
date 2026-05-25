import { IPopularCollection } from '../../../models/popular-collection.model';
export declare class PopularCollectionService {
    static list(status?: string): Promise<(IPopularCollection & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static getBySlug(slug: string): Promise<IPopularCollection & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    static getById(collection_id: string): Promise<IPopularCollection & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    static create(data: Partial<IPopularCollection>, userId?: string): Promise<import("mongoose").Document<unknown, {}, IPopularCollection, {}, import("mongoose").DefaultSchemaOptions> & IPopularCollection & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static update(collection_id: string, data: Partial<IPopularCollection>, userId?: string): Promise<import("mongoose").Document<unknown, {}, IPopularCollection, {}, import("mongoose").DefaultSchemaOptions> & IPopularCollection & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static remove(collection_id: string): Promise<import("mongoose").Document<unknown, {}, IPopularCollection, {}, import("mongoose").DefaultSchemaOptions> & IPopularCollection & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateCarOrdering(collection_id: string, payload: {
        pinned_car_ids?: string[];
        manual_car_ids?: string[];
        suppressed_car_ids?: string[];
    }, userId?: string): Promise<import("mongoose").Document<unknown, {}, IPopularCollection, {}, import("mongoose").DefaultSchemaOptions> & IPopularCollection & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateRenderingMode(collection_id: string, payload: {
        rendering_mode: string;
        manual_weight?: number;
        behavioral_weight?: number;
        min_behavioral_confidence?: number;
    }, userId?: string): Promise<import("mongoose").Document<unknown, {}, IPopularCollection, {}, import("mongoose").DefaultSchemaOptions> & IPopularCollection & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static publish(collection_id: string, userId?: string): Promise<import("mongoose").Document<unknown, {}, IPopularCollection, {}, import("mongoose").DefaultSchemaOptions> & IPopularCollection & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static archive(collection_id: string, userId?: string): Promise<import("mongoose").Document<unknown, {}, IPopularCollection, {}, import("mongoose").DefaultSchemaOptions> & IPopularCollection & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static reorderHubSections(orderedIds: string[], userId?: string): Promise<void>;
}
//# sourceMappingURL=popular-collection.service.d.ts.map