import { IFuelType } from "../../../models/fuel-type.model";
export declare class FuelTypeService {
    static getAllFuelTypes(filterDto: any, includeDeleted?: boolean): Promise<{
        fuelTypes: any[];
        pagination: any;
    }>;
    static getFuelTypeById(fuelTypeId: string): Promise<(IFuelType & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static getFuelTypeBySlug(slug: string): Promise<(IFuelType & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static createFuelType(fuelTypeData: any): Promise<any>;
    static updateFuelType(fuelTypeId: string, fuelTypeData: any): Promise<IFuelType & import("../../../sql/common/BaseModel").SQLDocument>;
    static deleteFuelType(fuelTypeId: string): Promise<IFuelType & import("../../../sql/common/BaseModel").SQLDocument>;
    static restoreFuelType(fuelTypeId: string): Promise<IFuelType & import("../../../sql/common/BaseModel").SQLDocument>;
    static togglePublish(fuelTypeId: string): Promise<IFuelType & import("../../../sql/common/BaseModel").SQLDocument>;
}
