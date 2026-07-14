"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const user_model_1 = require("../../../models/user.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const settings_service_1 = require("../services/settings.service");
const validation_1 = require("../../../shared/validation");
class SettingsController {
    static updateTheme = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user?.id || req.user?.user_id;
        const { theme } = req.body;
        if (!theme) {
            throw new app_error_util_1.AppError("Theme is required", 400);
        }
        const user = await user_model_1.User.findOneAndUpdate({ user_id: userId }, { theme }, { returnDocument: 'after' });
        if (!user) {
            throw new app_error_util_1.AppError("User not found", 404);
        }
        return response_util_1.ResponseUtil.success(res, { theme: user.theme }, "Theme updated successfully");
    });
    static getSEOSettings = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const seoSettings = await settings_service_1.SettingsService.getSEOSettings();
        return response_util_1.ResponseUtil.success(res, seoSettings, "SEO settings retrieved successfully");
    });
    static updateSEOSettings = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const updateDto = {
            site_title: req.body.site_title,
            site_description: req.body.site_description,
            site_keywords: req.body.site_keywords,
            og_default_image: req.body.og_default_image,
            twitter_handle: req.body.twitter_handle,
            google_analytics_id: req.body.google_analytics_id,
            google_tag_manager_id: req.body.google_tag_manager_id,
            facebook_pixel_id: req.body.facebook_pixel_id,
        };
        const validation = validation_1.UpdateSEOSettingsDto.validate(updateDto);
        if (!validation.success) {
            throw new app_error_util_1.AppError(validation.error.issues.map((e) => e.message).join(', '), 400);
        }
        const seoSettings = await settings_service_1.SettingsService.updateSEOSettings(updateDto);
        return response_util_1.ResponseUtil.success(res, seoSettings, "SEO settings updated successfully");
    });
}
exports.SettingsController = SettingsController;
