import { IFuelType } from "../../../models/fuel-type.model";
export declare class FuelTypeService {
    static getAllFuelTypes(filterDto: any, includeDeleted?: boolean): Promise<{
        fuelTypes: (import("mongoose").Document<unknown, {}, IFuelType, {}, import("mongoose").DefaultSchemaOptions> & IFuelType & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getFuelTypeById(fuelTypeId: string): Promise<(import("mongoose").Document<unknown, {}, IFuelType, {}, import("mongoose").DefaultSchemaOptions> & IFuelType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static getFuelTypeBySlug(slug: string): Promise<(import("mongoose").Document<unknown, {}, IFuelType, {}, import("mongoose").DefaultSchemaOptions> & IFuelType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static createFuelType(fuelTypeData: any): Promise<import("mongoose").Document<unknown, {}, IFuelType, {}, import("mongoose").DefaultSchemaOptions> & IFuelType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateFuelType(fuelTypeId: string, fuelTypeData: any): Promise<import("mongoose").Document<unknown, {}, IFuelType, {}, import("mongoose").DefaultSchemaOptions> & IFuelType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static deleteFuelType(fuelTypeId: string): Promise<import("mongoose").Document<unknown, {}, IFuelType, {}, import("mongoose").DefaultSchemaOptions> & IFuelType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static restoreFuelType(fuelTypeId: string): Promise<import("mongoose").Document<unknown, {}, IFuelType, {}, import("mongoose").DefaultSchemaOptions> & IFuelType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static togglePublish(fuelTypeId: string): Promise<import("mongoose").Document<unknown, {}, IFuelType, {}, import("mongoose").DefaultSchemaOptions> & IFuelType & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=fuel-type.service.d.ts.map