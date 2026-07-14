export interface EntityConnections {
    connected_cars?: string[];
    connected_variants?: string[];
    connected_brands?: string[];
    connected_body_types?: string[];
    connected_fuel_types?: string[];
    connected_comparisons?: string[];
    connected_collections?: string[];
}
export declare class BlogRelationshipService {
    static updateConnections(blogId: string, connections: EntityConnections): Promise<import("../../../models/blog.model").IBlog & import("../../../sql/common/BaseModel").SQLDocument>;
    static getConnections(blogId: string): Promise<import("../../../models/blog.model").IBlog & import("../../../sql/common/BaseModel").SQLDocument>;
    static getRelatedEntityNames(blogId: string): Promise<{
        cars: never[] | (import("../../../models/car.model").ICar & import("../../../sql/common/BaseModel").SQLDocument)[];
        brands: never[] | (import("../../../models/brand.model").IBrand & import("../../../sql/common/BaseModel").SQLDocument)[];
        connections: import("../../../models/blog.model").IBlog & import("../../../sql/common/BaseModel").SQLDocument;
    }>;
}
