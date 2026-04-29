import { Request, Response } from "express";
import { User } from "../../../models/user.model";
import { AppError } from "../../../shared/utils/app-error.util";
import { ResponseUtil } from "../../../shared/utils/response.util";
import { catchAsync } from "../../../utils/catchAsync";
import { UpdateSEOSettingsDto } from "../dto/update-seo-settings.dto";
import { SettingsService } from "../services/settings.service";

export class SettingsController {
  static updateTheme = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || (req as any).user?.user_id;
    const { theme } = req.body;

    if (!theme) {
      throw new AppError("Theme is required", 400);
    }

    const user = await User.findOneAndUpdate(
      { user_id: userId },
      { theme },
      { returnDocument: 'after' }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return ResponseUtil.success(res, { theme: user.theme }, "Theme updated successfully");
  });

  static getSEOSettings = catchAsync(async (req: Request, res: Response) => {
    const seoSettings = await SettingsService.getSEOSettings();
    return ResponseUtil.success(res, seoSettings, "SEO settings retrieved successfully");
  });

  static updateSEOSettings = catchAsync(async (req: Request, res: Response) => {
    const updateDto: UpdateSEOSettingsDto = {
      site_title: req.body.site_title,
      site_description: req.body.site_description,
      site_keywords: req.body.site_keywords,
      og_default_image: req.body.og_default_image,
      twitter_handle: req.body.twitter_handle,
      google_analytics_id: req.body.google_analytics_id,
      google_tag_manager_id: req.body.google_tag_manager_id,
      facebook_pixel_id: req.body.facebook_pixel_id,
    };

    const validation = UpdateSEOSettingsDto.validate(updateDto);
    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    const seoSettings = await SettingsService.updateSEOSettings(updateDto);
    return ResponseUtil.success(res, seoSettings, "SEO settings updated successfully");
  });
}
