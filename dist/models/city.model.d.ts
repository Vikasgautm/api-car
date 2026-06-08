import { Document } from 'mongoose';
export interface ICity extends Document {
    city_id: string;
    name: string;
    slug: string;
    state: string;
    country?: string;
    pincode?: string;
    longitude?: number;
    latitude?: number;
    is_published?: boolean;
    is_featured?: boolean;
    noindex?: boolean;
    is_deleted?: boolean;
    deleted_at?: Date;
}
export declare const City: import("mongoose").Model<ICity, {}, {}, {}, Document<unknown, {}, ICity, {}, import("mongoose").DefaultSchemaOptions> & ICity & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICity>;
//# sourceMappingURL=city.model.d.ts.map