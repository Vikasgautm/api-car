import { ICarVariant, SpecsNormalized } from "../../../models/car-variant.model";
export declare class CarVariantService {
    private static SECTION_NAME_TO_KEY_MAP;
    static removeHiddenSpecKeys(specs_normalized: SpecsNormalized | undefined, hidden_spec_keys?: string[]): SpecsNormalized | undefined;
    static removeHiddenSections(specs_normalized: SpecsNormalized | undefined, hidden_sections: string[] | undefined): SpecsNormalized | undefined;
    static applyFuelTypeFilter(specs_normalized: SpecsNormalized | undefined, fuel_type_ref: string | {
        name?: string;
        slug?: string;
    } | any): SpecsNormalized | undefined;
    static removeEmptyValues(specs_normalized: SpecsNormalized | undefined): SpecsNormalized | undefined;
    static autoHideEmptySections(specs_normalized: SpecsNormalized | undefined): SpecsNormalized | undefined;
    static getAllVariants(filterDto: any, includeDeleted?: boolean): Promise<{
        variants: (ICarVariant & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getVariantById(variantId: string): Promise<(import("mongoose").Document<unknown, {}, ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static getVariantBySlug(slug: string): Promise<(import("mongoose").Document<unknown, {}, ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static createVariant(variantData: any): Promise<import("mongoose").Document<unknown, {}, ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateVariant(variantId: string, variantData: any): Promise<import("mongoose").Document<unknown, {}, ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static deleteVariant(variantId: string): Promise<import("mongoose").Document<unknown, {}, ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static restoreVariant(variantId: string): Promise<import("mongoose").Document<unknown, {}, ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static togglePublish(variantId: string): Promise<import("mongoose").Document<unknown, {}, ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static publishVariant(variantId: string): Promise<import("mongoose").Document<unknown, {}, ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static unpublishVariant(variantId: string): Promise<import("mongoose").Document<unknown, {}, ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static archiveVariant(variantId: string, archivedBy?: string): Promise<import("mongoose").Document<unknown, {}, ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static unarchiveVariant(variantId: string): Promise<import("mongoose").Document<unknown, {}, ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & ICarVariant & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=car-variant.service.d.ts.map