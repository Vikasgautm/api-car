import { Document } from 'mongoose';
export interface ICarInfo {
    brand: string;
    model: string;
    price_min: number;
    price_max: number;
}
export interface ICarCompare extends Document {
    car_compare_id: string;
    car1: ICarInfo;
    car2: ICarInfo;
    image: Array<{
        preview: string;
        title: string;
    }>;
    comparison_title: string;
    route_link: string;
    is_published: boolean;
}
export declare const CarCompare: import("mongoose").Model<ICarCompare, {}, {}, {}, Document<unknown, {}, ICarCompare, {}, import("mongoose").DefaultSchemaOptions> & ICarCompare & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICarCompare>;
//# sourceMappingURL=car-compare.model.d.ts.map