import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { User } from "../../../models/user.model";
import { AppError } from "../../../shared/utils/app-error.util";
import { PaginationUtil } from "../../../shared/utils/pagination.util";
import { EmailService } from "../../../shared/services/email.service";
import { config } from '../../../config';
import { getPool } from '../../../sql/utils/dbConnection';

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

    const pool = await getPool();
    // Check if email already exists
    const [existingUsers]: any = await pool.pool.execute(
      'SELECT * FROM Users WHERE email = ? AND is_deleted = 0 LIMIT 1',
      [email as any]
    );
    if (existingUsers.length > 0) {
      throw new AppError('User with this email already exists', 409);
    }

    // Generate user_id from email (remove domain and special chars)
    const user_id = (email as string).split('@')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Create user
    let hashedPassword = null;
    let resetTokenHash = null;
    let resetExpires = null;
    let resetToken = undefined;

    if (password) {
      hashedPassword = await bcrypt.hash(password as string, 12);
    } else {
      // Generate password reset token for invite link
      resetToken = crypto.randomBytes(32).toString('hex');
      resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      resetExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }

    const isActiveVal = is_active !== undefined ? (is_active ? 1 : 0) : 1;

    await pool.pool.execute(
      `INSERT INTO Users (user_id, user_name, email, role, password, password_reset_token, password_reset_expires, is_active, is_deleted, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
      [user_id, user_name, email, role, hashedPassword, resetTokenHash, resetExpires, isActiveVal] as any[]
    );

    // Retrieve user details
    const [userRows]: any = await pool.pool.execute(
      'SELECT * FROM Users WHERE user_id = ? LIMIT 1',
      [user_id]
    );
    const userObj = userRows[0];
    this.parseJsonFields(userObj);

    // Send invite email if no password was provided
    if (resetToken) {
      const resetUrl = `${config.app.frontend_url}/auth/set-password?token=${resetToken}&user_id=${userObj.user_id}`;

      try {
        await EmailService.sendInviteEmail(email as string, user_name as string, resetUrl);
      } catch (error) {
        console.error('Failed to send invite email:', error);
        // Don't fail user creation if email sending fails
      }
    }

    delete userObj.password;
    return userObj;
  }

  static async deleteUser(userId: string) {
    const pool = await getPool();
    // Check if user exists
    const [userRows]: any = await pool.pool.execute(
      'SELECT * FROM Users WHERE user_id = ? AND is_deleted = 0 LIMIT 1',
      [userId]
    );
    if (userRows.length === 0) {
      throw new AppError('User not found', 404);
    }

    await pool.pool.execute(
      'UPDATE Users SET is_deleted = 1, updatedAt = NOW() WHERE user_id = ?',
      [userId]
    );

    const [updatedRows]: any = await pool.pool.execute(
      'SELECT * FROM Users WHERE user_id = ? LIMIT 1',
      [userId]
    );
    const userObj = updatedRows[0];
    this.parseJsonFields(userObj);

    delete userObj.password;
    return userObj;
  }

  static async restoreUser(userId: string) {
    const pool = await getPool();
    // Check if user exists and is deleted
    const [userRows]: any = await pool.pool.execute(
      'SELECT * FROM Users WHERE user_id = ? AND is_deleted = 1 LIMIT 1',
      [userId]
    );
    if (userRows.length === 0) {
      throw new AppError('User not found or not deleted', 404);
    }

    await pool.pool.execute(
      'UPDATE Users SET is_deleted = 0, updatedAt = NOW() WHERE user_id = ?',
      [userId]
    );

    const [updatedRows]: any = await pool.pool.execute(
      'SELECT * FROM Users WHERE user_id = ? LIMIT 1',
      [userId]
    );
    const userObj = updatedRows[0];
    this.parseJsonFields(userObj);

    delete userObj.password;
    return userObj;
  }

  static async updateUser(userId: string, updateData: Record<string, unknown>) {
    const pool = await getPool();

    // Check if user exists
    const [userRows]: any = await pool.pool.execute(
      'SELECT * FROM Users WHERE user_id = ? AND is_deleted = 0 LIMIT 1',
      [userId]
    );
    if (userRows.length === 0) {
      throw new AppError('User not found', 404);
    }

    // Check if email is being updated and if it already exists
    if (updateData.email) {
      const [existingUsers]: any = await pool.pool.execute(
        'SELECT * FROM Users WHERE email = ? AND user_id <> ? AND is_deleted = 0 LIMIT 1',
        [updateData.email as any, userId]
      );
      if (existingUsers.length > 0) {
        throw new AppError('Email already in use', 409);
      }
    }

    // Build dynamic UPDATE query
    const setClauses: string[] = [];
    const values: any[] = [];

    const keysToUpdate = Object.keys(updateData).filter(
      k => k !== 'id' && k !== 'user_id' && typeof updateData[k] !== 'function'
    );

    for (const key of keysToUpdate) {
      setClauses.push(`\`${key}\` = ?`);
      let val = updateData[key];
      if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
        val = JSON.stringify(val);
      }
      values.push(val);
    }

    if (setClauses.length > 0) {
      values.push(userId);
      await pool.pool.execute(
        `UPDATE Users SET ${setClauses.join(', ')}, updatedAt = NOW() WHERE user_id = ?`,
        values
      );
    }

    const [updatedRows]: any = await pool.pool.execute(
      'SELECT * FROM Users WHERE user_id = ? LIMIT 1',
      [userId]
    );
    const userObj = updatedRows[0];
    this.parseJsonFields(userObj);

    delete userObj.password;
    return userObj;
  }

  private static parseJsonFields(user: any) {
    if (!user) return;
    const jsonFields = ['permissions', 'assigned_brands', 'assigned_domains', 'workflow_rights', 'security'];
    for (const f of jsonFields) {
      if (typeof user[f] === 'string') {
        try {
          user[f] = JSON.parse(user[f]);
        } catch (e) {
          // Keep as string
        }
      }
    }
  }
}
