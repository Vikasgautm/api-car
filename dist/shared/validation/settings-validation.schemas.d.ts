import { z } from 'zod';
export declare const updateSEOSettingsSchema: z.ZodObject<{
    site_title: z.ZodOptional<z.ZodString>;
    site_description: z.ZodOptional<z.ZodString>;
    site_keywords: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    og_default_image: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    twitter_handle: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    google_analytics_id: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    google_tag_manager_id: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    facebook_pixel_id: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, z.core.$strict>;
export declare const updateThemeSchema: z.ZodObject<{
    theme: z.ZodString;
}, z.core.$strict>;
export declare class UpdateSEOSettingsDto {
    site_title?: string;
    site_description?: string;
    site_keywords?: string;
    og_default_image?: string;
    twitter_handle?: string;
    google_analytics_id?: string;
    google_tag_manager_id?: string;
    facebook_pixel_id?: string;
    static validate(dto: any): z.ZodSafeParseResult<{
        site_title?: string | undefined;
        site_description?: string | undefined;
        site_keywords?: string | undefined;
        og_default_image?: string | undefined;
        twitter_handle?: string | undefined;
        google_analytics_id?: string | undefined;
        google_tag_manager_id?: string | undefined;
        facebook_pixel_id?: string | undefined;
    }>;
}
