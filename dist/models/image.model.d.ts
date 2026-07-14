export interface IImage {
    image_id: string;
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
import { BaseModel } from '../sql/common/BaseModel';
export declare const Image: BaseModel<IImage>;
