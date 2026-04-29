import { Document } from 'mongoose';
export interface IBodyType extends Document {
    body_type_id: string;
    name: string;
    slug: string;
    description?: string;
    is_published: boolean;
    is_deleted: boolean;
    is_featured?: boolean;
    logo?: {
        title?: string;
        url: string;
    };
}
export declare const BodyType: import("mongoose").Model<IBodyType, {}, {}, {}, Document<unknown, {}, IBodyType, {}, import("mongoose").DefaultSchemaOptions> & IBodyType & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IBodyType>;
//# sourceMappingURL=body-type.model.d.ts.map