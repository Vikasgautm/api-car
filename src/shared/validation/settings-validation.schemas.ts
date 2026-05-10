import { z } from 'zod';

// Settings DTO schemas
export const updateSEOSettingsSchema = z.object({
  site_title: z.string().min(3).max(100).optional(),
  site_description: z.string().min(10).max(8000).optional(),
  site_keywords: z.string().max(8000).optional().or(z.literal('')),
  og_default_image: z.string().url().optional().or(z.literal('')),
  twitter_handle: z.string().max(50).regex(/^@/, 'Twitter handle must start with @').optional().or(z.literal('')),
  google_analytics_id: z.string().max(50).regex(/^(G-[A-Z0-9]{10}|UA-\d{4,10}-\d{1,4})$/, 'Invalid Google Analytics ID format').optional().or(z.literal('')),
  google_tag_manager_id: z.string().max(50).regex(/^GTM-[A-Z0-9]{7}$/, 'Invalid GTM ID format').optional().or(z.literal('')),
  facebook_pixel_id: z.string().max(50).regex(/^\d+$/, 'Facebook Pixel ID must be numeric').optional().or(z.literal('')),
}).strict();

export const updateThemeSchema = z.object({
  theme: z.string().min(1, 'Theme is required'),
}).strict();
