import { Document } from 'mongoose';
export interface IImage extends Document {
    url: string;
    public_id?: string;
    original_name: string;
    mime_type: string;
    size: number;
    folder?: string;
    alt_text?: string;
    caption?: string;
    tags?: string[];
    uploaded_by?: string;
    is_published: boolean;
    is_deleted: boolean;
    metadata?: Record<string, any>;
}
export declare const Image: import("mongoose").Model<IImage, {}, {}, {}, Document<unknown, {}, IImage, {}, import("mongoose").DefaultSchemaOptions> & IImage & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IImage>;
//# sourceMappingURL=image.model.d.ts.map