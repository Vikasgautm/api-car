"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const seo_settings_model_1 = require("../../../models/seo-settings.model");
class SettingsService {
    static async getSEOSettings() {
        let seoSettings = await seo_settings_model_1.SEOSettings.findOne();
        if (!seoSettings) {
            seoSettings = await seo_settings_model_1.SEOSettings.create({
                site_title: 'Car Salahakar',
                site_description: 'Your trusted car comparison and information portal',
                site_keywords: 'cars, car comparison, car reviews, automotive',
                og_default_image: '',
                twitter_handle: '',
                google_analytics_id: '',
                google_tag_manager_id: '',
                facebook_pixel_id: '',
            });
        }
        return seoSettings;
    }
    static async updateSEOSettings(updateDto) {
        let seoSettings = await seo_settings_model_1.SEOSettings.findOne();
        if (!seoSettings) {
            seoSettings = await seo_settings_model_1.SEOSettings.create(updateDto);
        }
        else {
            // Safe update: only update provided fields
            const updateData = {};
            if (updateDto.site_title !== undefined) {
                updateData.site_title = updateDto.site_title;
            }
            if (updateDto.site_description !== undefined) {
                updateData.site_description = updateDto.site_description;
            }
            if (updateDto.site_keywords !== undefined) {
                updateData.site_keywords = updateDto.site_keywords;
            }
            if (updateDto.og_default_image !== undefined) {
                updateData.og_default_image = updateDto.og_default_image;
            }
            if (updateDto.twitter_handle !== undefined) {
                updateData.twitter_handle = updateDto.twitter_handle;
            }
            if (updateDto.google_analytics_id !== undefined) {
                updateData.google_analytics_id = updateDto.google_analytics_id;
            }
            if (updateDto.google_tag_manager_id !== undefined) {
                updateData.google_tag_manager_id = updateDto.google_tag_manager_id;
            }
            if (updateDto.facebook_pixel_id !== undefined) {
                updateData.facebook_pixel_id = updateDto.facebook_pixel_id;
            }
            seoSettings = await seo_settings_model_1.SEOSettings.findByIdAndUpdate(seoSettings._id, updateData, { returnDocument: 'after', runValidators: true });
        }
        return seoSettings;
    }
}
exports.SettingsService = SettingsService;
