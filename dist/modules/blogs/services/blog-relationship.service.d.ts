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
    static updateConnections(blogId: string, connections: EntityConnections): Promise<import("../../../models/blog.model").IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    static getConnections(blogId: string): Promise<import("../../../models/blog.model").IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    static getRelatedEntityNames(blogId: string): Promise<{
        cars: never[] | (import("../../../models/car.model").ICar & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        brands: never[] | (import("../../../models/brand.model").IBrand & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        connections: import("../../../models/blog.model").IBlog & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
}
//# sourceMappingURL=blog-relationship.service.d.ts.map