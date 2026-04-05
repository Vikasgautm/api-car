export declare class CarVariantService {
    static getAllVariants(query: any, fetchAsAdmin?: boolean): Promise<{
        variants: (import("mongoose").Document<unknown, {}, import("../../../models/car-variant.model").ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-variant.model").ICarVariant & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    static getVariantBySlug(slug: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/car-variant.model").ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-variant.model").ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static createVariant(variantData: any): Promise<import("mongoose").Document<unknown, {}, import("../../../models/car-variant.model").ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-variant.model").ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateVariant(id: string, variantData: any): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/car-variant.model").ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-variant.model").ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static deleteVariant(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/car-variant.model").ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-variant.model").ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static restoreVariant(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/car-variant.model").ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-variant.model").ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
}
//# sourceMappingURL=car-variant.service.d.ts.map