import { Document } from 'mongoose';
export interface ICarVariant extends Document {
    variant_id: string;
    variant_name: string;
    description: string;
    slug: string;
    car_id: string;
    exshowroom_price: string;
    expectedExShowroomPrice?: string;
    expectedLaunchDate?: string;
    specification?: any;
    is_published: boolean;
}
export declare const CarVariant: import("mongoose").Model<ICarVariant, {}, {}, {}, Document<unknown, {}, ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & ICarVariant & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICarVariant>;
//# sourceMappingURL=car-variant.model.d.ts.map