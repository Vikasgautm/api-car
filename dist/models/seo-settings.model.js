"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEOSettings = void 0;
const mongoose_1 = require("mongoose");
const seoSettingsSchema = new mongoose_1.Schema({
    site_title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100
    },
    site_description: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 8000
    },
    site_keywords: {
        type: String,
        trim: true,
        maxlength: 8000
    },
    og_default_image: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                if (!v || v === '')
                    return true;
                try {
                    new URL(v);
                    return true;
                }
                catch {
                    return false;
                }
            },
            message: 'og_default_image must be a valid URL'
        }
    },
    twitter_handle: {
        type: String,
        trim: true,
        maxlength: 50,
        validate: {
            validator: function (v) {
                if (!v || v === '')
                    return true;
                return v.startsWith('@');
            },
            message: 'twitter_handle must start with @'
        }
    },
    google_analytics_id: {
        type: String,
        trim: true,
        maxlength: 50,
        validate: {
            validator: function (v) {
                if (!v || v === '')
                    return true;
                const gaPattern = /^(G-[A-Z0-9]{10}|UA-\d{4,10}-\d{1,4})$/;
                return gaPattern.test(v);
            },
            message: 'google_analytics_id must be in format G-XXXXXXXXXX or UA-XXXXXXXX-X'
        }
    },
    google_tag_manager_id: {
        type: String,
        trim: true,
        maxlength: 50,
        validate: {
            validator: function (v) {
                if (!v || v === '')
                    return true;
                const gtmPattern = /^GTM-[A-Z0-9]{7}$/;
                return gtmPattern.test(v);
            },
            message: 'google_tag_manager_id must be in format GTM-XXXXXXX'
        }
    },
    facebook_pixel_id: {
        type: String,
        trim: true,
        maxlength: 50,
        validate: {
            validator: function (v) {
                if (!v || v === '')
                    return true;
                const numericPattern = /^\d+$/;
                return numericPattern.test(v);
            },
            message: 'facebook_pixel_id must be numeric'
        }
    },
}, {
    timestamps: true,
});
seoSettingsSchema.index({ updatedAt: -1 });
exports.SEOSettings = (0, mongoose_1.model)('SEOSettings', seoSettingsSchema);
//# sourceMappingURL=seo-settings.model.js.map