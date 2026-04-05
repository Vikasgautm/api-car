import { Document } from 'mongoose';
export interface IFuelType extends Document {
    fuel_type_id: string;
    name: string;
    slug: string;
    description?: string;
    is_deleted: boolean;
}
export declare const FuelType: import("mongoose").Model<IFuelType, {}, {}, {}, Document<unknown, {}, IFuelType, {}, import("mongoose").DefaultSchemaOptions> & IFuelType & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IFuelType>;
//# sourceMappingURL=fuel-type.model.d.ts.map