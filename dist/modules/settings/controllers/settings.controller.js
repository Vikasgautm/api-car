"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const user_model_1 = require("../../../models/user.model");
const catchAsync_1 = require("../../../utils/catchAsync");
const seo_settings_model_1 = require("../../../models/seo-settings.model");
class SettingsController {
    static updateTheme = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { theme } = req.body;
        if (!theme) {
            throw new error_middleware_1.AppError("Theme is required", 400);
        }
        const user = await user_model_1.User.findOneAndUpdate({ user_id: userId }, { theme }, { returnDocument: "after" });
        if (!user) {
            throw new error_middleware_1.AppError("User not found", 404);
        }
        res.status(200).json({
            status: "success",
            data: { theme: user.theme },
        });
    });
    static getSEOSettings = (0, catchAsync_1.catchAsync)(async (req, res) => {
        let seoSettings = await seo_settings_model_1.SEOSettings.findOne();
        if (!seoSettings) {
            // Create default settings if none exist
            seoSettings = await seo_settings_model_1.SEOSettings.create({
                site_title: "Car Salahakar",
                site_description: "Your trusted car comparison and information portal",
                site_keywords: "cars, car comparison, car reviews, automotive",
                og_default_image: "",
                twitter_handle: "",
                google_analytics_id: "",
                google_tag_manager_id: "",
                facebook_pixel_id: "",
            });
        }
        res.status(200).json({
            status: "success",
            data: { seoSettings },
        });
    });
    static updateSEOSettings = (0, catchAsync_1.catchAsync)(async (req, res) => {
        let seoSettings = await seo_settings_model_1.SEOSettings.findOne();
        if (!seoSettings) {
            seoSettings = await seo_settings_model_1.SEOSettings.create(req.body);
        }
        else {
            seoSettings = await seo_settings_model_1.SEOSettings.findByIdAndUpdate(seoSettings._id, req.body, { new: true, runValidators: true });
        }
        res.status(200).json({
            status: "success",
            data: { seoSettings },
        });
    });
}
exports.SettingsController = SettingsController;
//# sourceMappingURL=settings.controller.js.map