import { Document } from 'mongoose';
export interface ISEOSettings extends Document {
    site_title: string;
    site_description: string;
    site_keywords?: string;
    og_default_image?: string;
    twitter_handle?: string;
    google_analytics_id?: string;
    google_tag_manager_id?: string;
    facebook_pixel_id?: string;
}
export declare const SEOSettings: import("mongoose").Model<ISEOSettings, {}, {}, {}, Document<unknown, {}, ISEOSettings, {}, import("mongoose").DefaultSchemaOptions> & ISEOSettings & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ISEOSettings>;
//# sourceMappingURL=seo-settings.model.d.ts.map