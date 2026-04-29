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
//# sourceMappingURL=settings-validation.schemas.d.ts.map