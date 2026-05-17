import crypto from 'crypto';
import { User } from "../../../models/user.model";
import { AppError } from "../../../shared/utils/app-error.util";
import { PaginationUtil } from "../../../shared/utils/pagination.util";
import { EmailService } from "../../../shared/services/email.service";
import { config } from '../../../config';

export class UserService {
  static async getAllUsers(filterDto: any, includeDeleted: boolean = false) {
    const {
      page = 1,
      limit = 10,
      role,
      is_email_verified,
      is_active,
      is_deleted,
      q,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    const filter: Record<string, unknown> = {};

    if (!includeDeleted) {
      filter.is_deleted = false;
    }

    // Allow explicit is_deleted filter when includeDeleted is true
    if (includeDeleted && is_deleted !== undefined) {
      filter.is_deleted = is_deleted === 'true' || is_deleted === true;
    }

    if (role !== undefined) {
      filter.role = role;
    }

    if (is_email_verified !== undefined) {
      filter.is_email_verified = is_email_verified === 'true' || is_email_verified === true;
    }

    if (is_active !== undefined) {
      filter.is_active = is_active === 'true' || is_active === true;
    }

    if (q) {
      filter.$or = [
        { user_name: { $regex: q as string, $options: 'i' } },
        { email: { $regex: q as string, $options: 'i' } },
      ];
    }

    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);
    const sortFilter: Record<string, 1 | -1> = {};
    sortFilter[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(filter)
      .select("-password")
      .sort(sortFilter)
      .skip(skip)
      .limit(validatedLimit);

    const total = await User.countDocuments(filter);
    const paginationMeta = PaginationUtil.createPaginationMeta(page, validatedLimit, total);

    return { users, pagination: paginationMeta };
  }

  static async getUserById(userId: string) {
    return await User.findOne({ user_id: userId }).select("-password");
  }

  static async createUser(userData: Record<string, unknown>) {
    const { user_name, email, role, password, is_active } = userData;

    // Validate required fields
    if (!user_name || !email || !role) {
      throw new AppError('Name, email, and role are required', 400);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email as string, is_deleted: false });
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Generate user_id from email (remove domain and special chars)
    const user_id = (email as string).split('@')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Create user
    const createData: Record<string, unknown> = {
      user_id,
      user_name,
      email,
      role,
      is_active: is_active !== undefined ? is_active : true,
      is_deleted: false,
    };

    // If password provided, use it; otherwise generate reset token for invite
    let resetToken: string | undefined;
    if (password) {
      createData.password = password;
    } else {
      // Generate password reset token for invite link
      resetToken = crypto.randomBytes(32).toString('hex');
      const resetHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      createData.password_reset_token = resetHash;
      createData.password_reset_expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }

    const user = await User.create(createData);

    // Send invite email if no password was provided
    if (resetToken) {
      const resetUrl = `${config.app.frontend_url}/auth/set-password?token=${resetToken}&user_id=${user.user_id}`;

      try {
        await EmailService.sendInviteEmail(email as string, user_name as string, resetUrl);
      } catch (error) {
        console.error('Failed to send invite email:', error);
        // Don't fail user creation if email sending fails
      }
    }

    return user;
  }

  static async deleteUser(userId: string) {
    const user = await User.findOneAndUpdate(
      { user_id: userId },
      { is_deleted: true },
      { returnDocument: 'after' }
    ).select("-password");

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  static async restoreUser(userId: string) {
    const user = await User.findOneAndUpdate(
      { user_id: userId, is_deleted: true },
      { is_deleted: false },
      { returnDocument: 'after' }
    ).select("-password");

    if (!user) {
      throw new AppError('User not found or not deleted', 404);
    }

    return user;
  }

  static async updateUser(userId: string, updateData: Record<string, unknown>) {
    // Check if email is being updated and if it already exists
    if (updateData.email) {
      const existingUser = await User.findOne({
        email: updateData.email,
        user_id: { $ne: userId },
        is_deleted: false,
      });
      if (existingUser) {
        throw new AppError('Email already in use', 409);
      }
    }

    const user = await User.findOneAndUpdate(
      { user_id: userId, is_deleted: false },
      updateData,
      { returnDocument: 'after', runValidators: true }
    ).select("-password");

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
}
