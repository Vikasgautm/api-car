import { Document } from 'mongoose';
export interface ICarImage extends Document {
    car_image_id: string;
    image_uuid?: string;
    car_id: string;
    variant_id?: string;
    category_id?: string;
    sub_category_id?: string;
    url: string;
    thumbnail_url?: string;
    alt_text?: string;
    caption?: string;
    tags?: string[];
    sort_order: number;
    display_order?: number;
    is_primary: boolean;
    is_published: boolean;
    is_deleted: boolean;
    source?: string;
    car_condition?: string;
    taken_at?: Date;
    uploaded_by?: string;
    damage_area?: string;
    damage_note?: string;
    inspection_severity?: string;
    metadata?: Record<string, any>;
}
export declare const CarImage: import("mongoose").Model<ICarImage, {}, {}, {}, Document<unknown, {}, ICarImage, {}, import("mongoose").DefaultSchemaOptions> & ICarImage & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICarImage>;
//# sourceMappingURL=car-image.model.d.ts.map