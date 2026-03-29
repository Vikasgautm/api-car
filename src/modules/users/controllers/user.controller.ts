import { Request, Response } from "express";
import { catchAsync } from "../../../utils/catchAsync";
import { User } from "../../../models/user.model";
import { AppError } from "../../../middlewares/error.middleware";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export class UserController {
  static getProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const user = await User.findOne({ user_id: userId }).select("-password");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.status(200).json({
      status: "success",
      data: { user },
    });
  });

  static updateProfile = catchAsync(async (req: MulterRequest, res: Response) => {
    const userId = (req as any).user.id;
    const { user_name, phone } = req.body;
    let updateData: any = {};

    if (user_name) updateData.user_name = user_name;
    if (phone) updateData.phone = phone;

    if (req.file) {
      updateData.profile_pic = req.file.path;
    }

    const user = await User.findOneAndUpdate({ user_id: userId }, updateData, {
      new: true,
    }).select("-password");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.status(200).json({
      status: "success",
      data: { user },
    });
  });
}
