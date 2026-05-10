import { User } from "../../../models/user.model";
import { AppError } from "../../../shared/utils/app-error.util";
import { PaginationUtil } from "../../../shared/utils/pagination.util";

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
    const { name, email, role, status, password } = userData;
    
    // Validate required fields
    if (!name || !email || !role) {
      throw new AppError('Name, email, and role are required', 400);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email as string, is_deleted: false });
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Create user
    const createData: Record<string, unknown> = {
      name,
      email,
      role,
      status: status || 'active',
      is_deleted: false,
    };

    // Only include password if provided
    if (password) {
      createData.password = password;
    }

    const user = await User.create(createData);

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
