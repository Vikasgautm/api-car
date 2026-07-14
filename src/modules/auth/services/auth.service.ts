import { loginSchema, refreshTokenSchema, registerSchema } from '../../../shared/validation';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { config } from '../../../config';
import { AppError } from '../../../shared/utils/app-error.util';
import { getPool } from '../../../sql/utils/dbConnection';

export class AuthService {
  static async register(registerDto: any) {
    const { user_name, email, password, phone, role } = registerDto;

    const pool = await getPool();
    // Check if user already exists
    const [existingUsers]: any = await pool.pool.execute(
      'SELECT * FROM Users WHERE email = ? AND is_deleted = 0 LIMIT 1',
      [email]
    );
    if (existingUsers.length > 0) {
      throw new AppError('User with this email already exists', 400);
    }

    // Create new user
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 12);
    const userRole = role || 'user';
    await pool.pool.execute(
      `INSERT INTO Users (user_id, user_name, email, password, phone, role, is_email_verified, is_deleted, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, NOW(), NOW())`,
      [userId, user_name, email, hashedPassword, phone || null, userRole]
    );

    // Fetch the created user
    const [userRows]: any = await pool.pool.execute(
      'SELECT * FROM Users WHERE user_id = ? LIMIT 1',
      [userId]
    );
    const user = userRows[0];
    this.parseJsonFields(user);

    // // Generate tokens
    // const { accessToken, refreshToken } = await this.generateTokens(user);

    // // Save refresh token session
    // await this.saveRefreshToken(user.user_id, refreshToken);

    return {
      user: this.sanitizeUser(user),
      // accessToken,
      // refreshToken,
    };
  }

  static async login(loginDto: any, req?: any) {
    const { email, password } = loginDto;

    const pool = await getPool();
    // Find user
    const [userRows]: any = await pool.pool.execute(
      'SELECT * FROM Users WHERE email = ? AND is_deleted = 0 LIMIT 1',
      [email]
    );
    const user = userRows[0];
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password || '');
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    await pool.pool.execute(
      'UPDATE Users SET last_login_at = NOW(), updatedAt = NOW() WHERE user_id = ?',
      [user.user_id]
    );
    user.last_login_at = new Date();
    this.parseJsonFields(user);

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Save refresh token session with device info
    const deviceInfo = this.extractDeviceInfo(req);
    const ipAddress = this.extractIpAddress(req);
    await this.saveRefreshToken(user.user_id, refreshToken, deviceInfo, ipAddress);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  static async refreshToken(refreshTokenDto: any) {
    const { refreshToken: refresh_token } = refreshTokenDto;

    try {
      // Verify refresh token
      const decoded = jwt.verify(refresh_token, config.jwt_refresh_secret) as {
        user_id: string;
      };

      const pool = await getPool();
      // Check if refresh token exists in database
      const [sessionRows]: any = await pool.pool.execute(
        'SELECT * FROM UserSessions WHERE user_id = ? AND refresh_token = ? AND is_revoked = 0 LIMIT 1',
        [decoded.user_id, refresh_token]
      );
      const session = sessionRows[0];

      if (!session) {
        throw new AppError('Invalid or revoked refresh token', 401);
      }

      // Check if session has expired
      if (new Date(session.expires_at) < new Date()) {
        throw new AppError('Refresh token has expired. Please login again.', 401);
      }

      // Find user
      const [userRows]: any = await pool.pool.execute(
        'SELECT * FROM Users WHERE user_id = ? AND is_deleted = 0 LIMIT 1',
        [decoded.user_id]
      );
      const user = userRows[0];
      if (!user) {
        throw new AppError('User not found', 404);
      }
      this.parseJsonFields(user);

      // Generate new tokens
      const { accessToken, refreshToken } = await this.generateTokens(user);

      // Revoke old refresh token
      await pool.pool.execute(
        'UPDATE UserSessions SET is_revoked = 1, revoked_at = NOW(), updatedAt = NOW() WHERE session_id = ?',
        [session.session_id]
      );

      // Save new refresh token
      await this.saveRefreshToken(user.user_id, refreshToken);

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Refresh token has expired. Please login again.', 401);
      } else if (error.name === 'JsonWebTokenError') {
        throw new AppError('Invalid refresh token', 401);
      } else if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError('Failed to refresh token', 401);
      }
    }
  }

  static async logout(user_id: string) {
    const pool = await getPool();
    // Revoke all refresh tokens for this user
    await pool.pool.execute(
      'UPDATE UserSessions SET is_revoked = 1, revoked_at = NOW(), updatedAt = NOW() WHERE user_id = ? AND is_revoked = 0',
      [user_id]
    );

    return { message: 'Logged out successfully' };
  }

  static async getProfile(user_id: string) {
    const pool = await getPool();
    const [userRows]: any = await pool.pool.execute(
      'SELECT * FROM Users WHERE user_id = ? AND is_deleted = 0 LIMIT 1',
      [user_id]
    );
    const user = userRows[0];
    if (!user) {
      throw new AppError('User not found', 404);
    }
    this.parseJsonFields(user);

    return this.sanitizeUser(user);
  }

  static async resetPassword(token: string, user_id: string, password: string) {
    const pool = await getPool();
    // Find user
    const [userRows]: any = await pool.pool.execute(
      'SELECT * FROM Users WHERE user_id = ? AND is_deleted = 0 LIMIT 1',
      [user_id]
    );
    const user = userRows[0];
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    if (user.password_reset_token !== tokenHash) {
      throw new AppError('Invalid reset token', 400);
    }

    // Check if token has expired
    if (!user.password_reset_expires || new Date(user.password_reset_expires) < new Date()) {
      throw new AppError('Reset token has expired', 400);
    }

    // Update password and clear reset token
    const hashedPassword = await bcrypt.hash(password, 12);
    await pool.pool.execute(
      'UPDATE Users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL, updatedAt = NOW() WHERE user_id = ?',
      [hashedPassword, user_id]
    );

    return { message: 'Password reset successfully' };
  }

  private static async generateTokens(user: any) {
    const accessToken = jwt.sign(
      {
        id: user.id,
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        phone: user.phone,
        permissions: user.permissions,
        is_email_verified : user.is_email_verified,
        last_login_at : user.last_login_at,
        theme : user.theme
      },
      config.jwt_secret,
      { expiresIn: config.jwt_expires_in as `${number}${'s' | 'm' | 'h' | 'd'}` }
    );

    const refreshToken = jwt.sign(
      { 
        id: user.id,
        user_id: user.user_id,
        email: user.email,
        role: user.role
       },
      config.jwt_refresh_secret,
      { expiresIn: config.jwt_refresh_expires_in as `${number}${'s' | 'm' | 'h' | 'd'}` }
    );

    return { accessToken, refreshToken };
  }

  private static async saveRefreshToken(
    user_id: string,
    refreshToken: string,
    deviceInfo?: string,
    ipAddress?: string
  ) {
    const expiresMs = this.parseExpiresIn(config.jwt_refresh_expires_in);
    const expiresAt = new Date(Date.now() + expiresMs);
    const sessionId = uuidv4();
    const pool = await getPool();
    await pool.pool.execute(
      `INSERT INTO UserSessions (session_id, user_id, refresh_token, expires_at, is_revoked, device_info, ip_address, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 0, ?, ?, NOW(), NOW())`,
      [sessionId, user_id, refreshToken, expiresAt, deviceInfo || null, ipAddress || null]
    );
  }

  private static parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * (multipliers[unit] || multipliers['d']);
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

  private static sanitizeUser(user: any) {
    const userObj = { ...user };
    delete userObj.password;
    delete userObj.password_reset_token;
    delete userObj.password_reset_expires;
    delete userObj.__v;
    return userObj;
  }

  private static extractDeviceInfo(req?: any): string | undefined {
    if (!req) return undefined;
    const userAgent = req.headers['user-agent'];
    return userAgent ? String(userAgent) : undefined;
  }

  private static extractIpAddress(req?: any): string | undefined {
    if (!req) return undefined;
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return (forwarded as string).split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress;
  }
}
