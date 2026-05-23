interface LinkSuggestion {
    text: string;
    url: string;
    type: 'car' | 'brand' | 'fuel' | 'comparison' | 'collection' | 'blog';
    entity_id: string;
}
export declare class BlogLinkingService {
    static suggestLinks(content: string): Promise<LinkSuggestion[]>;
    static searchEntities(query: string, entityType: string): Promise<(import("../../../models/fuel-type.model").IFuelType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[] | (import("../../../models/car.model").ICar & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[] | (import("../../../models/seo-collection.model").ISeoCollection & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[] | (import("../../../models/comparison.model").IComparison & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[] | (import("../../../models/blog.model").IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[] | (import("../../../models/body-type.model").IBodyType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[] | (import("../../../models/brand.model").IBrand & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
}
export {};
//# sourceMappingURL=blog-linking.service.d.ts.map