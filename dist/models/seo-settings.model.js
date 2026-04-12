"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEOSettings = void 0;
const mongoose_1 = require("mongoose");
const seoSettingsSchema = new mongoose_1.Schema({
    site_title: { type: String, required: true },
    site_description: { type: String, required: true, maxlength: 160 },
    site_keywords: { type: String },
    og_default_image: { type: String },
    twitter_handle: { type: String },
    google_analytics_id: { type: String },
    google_tag_manager_id: { type: String },
    facebook_pixel_id: { type: String },
}, { timestamps: true });
exports.SEOSettings = (0, mongoose_1.model)('SEOSettings', seoSettingsSchema);
//# sourceMappingURL=seo-settings.model.js.map