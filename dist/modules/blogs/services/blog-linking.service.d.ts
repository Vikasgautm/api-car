interface LinkSuggestion {
    text: string;
    url: string;
    type: 'car' | 'brand' | 'fuel' | 'comparison' | 'collection' | 'blog';
    entity_id: string;
}
export declare class BlogLinkingService {
    static suggestLinks(content: string): Promise<LinkSuggestion[]>;
    static searchEntities(query: string, entityType: string): Promise<(import("../../../models/car.model").ICar & import("../../../sql/common/BaseModel").SQLDocument)[] | (import("../../../models/body-type.model").IBodyType & import("../../../sql/common/BaseModel").SQLDocument)[] | (import("../../../models/fuel-type.model").IFuelType & import("../../../sql/common/BaseModel").SQLDocument)[] | (import("../../../models/brand.model").IBrand & import("../../../sql/common/BaseModel").SQLDocument)[] | (import("../../../models/comparison.model").IComparison & import("../../../sql/common/BaseModel").SQLDocument)[] | (import("../../../models/seo-collection.model").ISeoCollection & import("../../../sql/common/BaseModel").SQLDocument)[] | (import("../../../models/blog.model").IBlog & import("../../../sql/common/BaseModel").SQLDocument)[]>;
}
export {};
