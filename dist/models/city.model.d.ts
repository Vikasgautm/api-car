import { Document } from 'mongoose';
export interface ICity extends Document {
    city_uuid: string;
    city_name: string;
    slug: string;
    state: string;
    pincode: number;
    longitude: number;
    latitude: number;
    city_logo?: string;
    is_deleted: boolean;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
}
export declare const City: import("mongoose").Model<ICity, {}, {}, {}, Document<unknown, {}, ICity, {}, import("mongoose").DefaultSchemaOptions> & ICity & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICity>;
//# sourceMappingURL=city.model.d.ts.map