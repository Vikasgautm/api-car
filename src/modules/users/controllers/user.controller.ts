import { Request, Response } from "express";
import { User } from "../../../models/user.model";
import { AppError } from "../../../shared/utils/app-error.util";
import { ResponseUtil } from "../../../shared/utils/response.util";
import { AuthRequest } from "../../../types/auth";
import { catchAsync } from "../../../utils/catchAsync";
import { AdminUpdateUserDto } from "../dto/admin-update-user.dto";
import { UpdateProfileDto } from "../dto/update-profile.dto";
import { UserFilterDto } from "../dto/user-filter.dto";
import { UserService } from "../services/user.service";

interface MulterRequest extends AuthRequest {
  file?: Express.Multer.File;
}

export class UserController {
  static getProfile = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = req.user as any;
    const userId = user?.user_id || user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const userProfile = await User.findOne({ user_id: userId, is_deleted: false }).select("-password");

    if (!userProfile) {
      throw new AppError("User not found", 404);
    }

    return ResponseUtil.success(res, userProfile, "Profile retrieved successfully");
  });

  static updateProfile = catchAsync(async (req: MulterRequest, res: Response) => {
    const user = req.user as any;
    const userId = user?.user_id || user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { user_name, phone } = req.body;
    let updateData: Record<string, unknown> = {};

    if (user_name) updateData.user_name = user_name;
    if (phone) updateData.phone = phone;

    if (req.file) {
      const cloudinaryFile = req.file as Express.Multer.File & { secure_url?: string };
      updateData.profile_pic = cloudinaryFile.secure_url || req.file.path;
    }

    const updateDto: UpdateProfileDto = { user_name, phone, profile_pic: updateData.profile_pic as string };
    const validation = UpdateProfileDto.validate(updateDto);
    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId, is_deleted: false },
      updateData,
      {
        returnDocument: 'after',
      }
    ).select("-password");

    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    return ResponseUtil.success(res, updatedUser, "Profile updated successfully");
  });

  // Admin endpoints
  static getAllAdminUsers = catchAsync(async (req: Request, res: Response) => {
    const filterDto = req.query as unknown as UserFilterDto;
    const validation = UserFilterDto.validate(filterDto);
    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    const includeDeleted = req.query.include_deleted === 'true';
    const result = await UserService.getAllUsers(filterDto, includeDeleted);
    return ResponseUtil.paginated(res, result.users, result.pagination, 'Users retrieved successfully');
  });

  static createAdminUser = catchAsync(async (req: Request, res: Response) => {
    const userData = req.body;
    
    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: userData.email, is_deleted: false });
    if (existingUser) {
      throw new AppError("User with this email already exists", 400);
    }

    const user = await UserService.createUser(userData);
    return ResponseUtil.success(res, user, "User created successfully");
  });

  static getAdminUserById = catchAsync(async (req: Request, res: Response) => {
    const user = await UserService.getUserById(req.params.id as string);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return ResponseUtil.success(res, user, "User retrieved successfully");
  });

  static deleteUser = catchAsync(async (req: Request, res: Response) => {
    const user = await UserService.deleteUser(req.params.id as string);
    return ResponseUtil.success(res, user, "User deleted successfully");
  });

  static restoreUser = catchAsync(async (req: Request, res: Response) => {
    const user = await UserService.restoreUser(req.params.id as string);
    return ResponseUtil.success(res, user, "User restored successfully");
  });

  static updateUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id as string;
    const updateDto: AdminUpdateUserDto = req.body;

    const validation = AdminUpdateUserDto.validate(updateDto);
    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    const user = await UserService.updateUser(userId, updateDto as Record<string, unknown>);
    return ResponseUtil.success(res, user, "User updated successfully");
  });
}
