"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateThemeSchema = exports.updateSEOSettingsSchema = void 0;
const zod_1 = require("zod");
// Settings DTO schemas
exports.updateSEOSettingsSchema = zod_1.z.object({
    site_title: zod_1.z.string().min(3).max(100).optional(),
    site_description: zod_1.z.string().min(10).max(500).optional(),
    site_keywords: zod_1.z.string().max(500).optional().or(zod_1.z.literal('')),
    og_default_image: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    twitter_handle: zod_1.z.string().max(50).regex(/^@/, 'Twitter handle must start with @').optional().or(zod_1.z.literal('')),
    google_analytics_id: zod_1.z.string().max(50).regex(/^(G-[A-Z0-9]{10}|UA-\d{4,10}-\d{1,4})$/, 'Invalid Google Analytics ID format').optional().or(zod_1.z.literal('')),
    google_tag_manager_id: zod_1.z.string().max(50).regex(/^GTM-[A-Z0-9]{7}$/, 'Invalid GTM ID format').optional().or(zod_1.z.literal('')),
    facebook_pixel_id: zod_1.z.string().max(50).regex(/^\d+$/, 'Facebook Pixel ID must be numeric').optional().or(zod_1.z.literal('')),
}).strict();
exports.updateThemeSchema = zod_1.z.object({
    theme: zod_1.z.string().min(1, 'Theme is required'),
}).strict();
//# sourceMappingURL=settings-validation.schemas.js.map