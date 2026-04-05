import { Request, Response } from "express";
import { catchAsync } from "../../../utils/catchAsync";
import { User } from "../../../models/user.model";
import { AppError } from "../../../middlewares/error.middleware";

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
}
