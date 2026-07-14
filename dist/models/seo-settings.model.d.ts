export interface ISEOSettings {
    site_title: string;
    site_description: string;
    site_keywords?: string;
    og_default_image?: string;
    twitter_handle?: string;
    google_analytics_id?: string;
    google_tag_manager_id?: string;
    facebook_pixel_id?: string;
}
import { BaseModel } from '../sql/common/BaseModel';
export declare const SEOSettings: BaseModel<ISEOSettings>;
