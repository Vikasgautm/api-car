import { Request, Response } from "express";
import { AppError } from "../../../middlewares/error.middleware";
import { User } from "../../../models/user.model";
import { catchAsync } from "../../../utils/catchAsync";
import { SEOSettings } from "../../../models/seo-settings.model";

export class SettingsController {
  static updateTheme = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { theme } = req.body;

    if (!theme) {
      throw new AppError("Theme is required", 400);
    }

    const user = await User.findOneAndUpdate(
      { user_id: userId },
      { theme },
      { returnDocument: "after" },
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.status(200).json({
      status: "success",
      data: { theme: user.theme },
    });
  });

  static getSEOSettings = catchAsync(async (req: Request, res: Response) => {
    let seoSettings = await SEOSettings.findOne();
    if (!seoSettings) {
      // Create default settings if none exist
      seoSettings = await SEOSettings.create({
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

  static updateSEOSettings = catchAsync(async (req: Request, res: Response) => {
    let seoSettings = await SEOSettings.findOne();
    if (!seoSettings) {
      seoSettings = await SEOSettings.create(req.body);
    } else {
      seoSettings = await SEOSettings.findByIdAndUpdate(
        seoSettings._id,
        req.body,
        { new: true, runValidators: true }
      );
    }
    res.status(200).json({
      status: "success",
      data: { seoSettings },
    });
  });
}
