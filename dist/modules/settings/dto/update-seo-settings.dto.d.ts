export interface UpdateSEOSettingsDto {
    site_title?: string;
    site_description?: string;
    site_keywords?: string;
    og_default_image?: string;
    twitter_handle?: string;
    google_analytics_id?: string;
    google_tag_manager_id?: string;
    facebook_pixel_id?: string;
}
export declare class UpdateSEOSettingsDto {
    static validate(data: UpdateSEOSettingsDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=update-seo-settings.dto.d.ts.map