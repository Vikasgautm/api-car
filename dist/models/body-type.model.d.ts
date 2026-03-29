import { Document } from 'mongoose';
export interface IBodyType extends Document {
    body_type_id: string;
    name: string;
    slug: string;
    description?: string;
}
export declare const BodyType: import("mongoose").Model<IBodyType, {}, {}, {}, Document<unknown, {}, IBodyType, {}, import("mongoose").DefaultSchemaOptions> & IBodyType & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IBodyType>;
//# sourceMappingURL=body-type.model.d.ts.map