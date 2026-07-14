import { loginSchema, refreshTokenSchema, registerSchema } from '../../../shared/validation';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../../config';
import { UserSession } from '../../../models/user-session.model';
import { IUser, User } from '../../../models/user.model';
import { AppError } from '../../../shared/utils/app-error.util';

export class AuthService {
  static async register(registerDto: any) {
    const { user_name, email, password, phone, role } = registerDto;

    // Check if user already exists
    const existingUser = await User.findOne({ email, is_deleted: false });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Create new user
    const user = User.createDraft({
      user_id: uuidv4(),
      user_name,
      email,
      password,
      phone,
      role: role || 'user',
      is_email_verified: false,
      is_deleted: false,
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Save refresh token session
    await this.saveRefreshToken(user.user_id, refreshToken);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  static async login(loginDto: any, req?: any) {
    const { email, password } = loginDto;

    // Find user
    const user = await User.findOne({ email, is_deleted: false }).select('+password');
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    user.last_login_at = new Date();
    await user.save();

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

      // Check if refresh token exists in database
      const session = await UserSession.findOne({
        user_id: decoded.user_id,
        refresh_token: refresh_token,
        is_revoked: false,
      });

      if (!session) {
        throw new AppError('Invalid or revoked refresh token', 401);
      }

      // Find user
      const user = await User.findOne({ user_id: decoded.user_id, is_deleted: false });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Generate new tokens
      const { accessToken, refreshToken } = await this.generateTokens(user);

      // Revoke old refresh token
      session.is_revoked = true;
      await session.save();

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
    // Revoke all refresh tokens for this user
    await UserSession.updateMany(
      { user_id, is_revoked: false },
      { is_revoked: true }
    );

    return { message: 'Logged out successfully' };
  }

  static async getProfile(user_id: string) {
    const user = await User.findOne({ user_id, is_deleted: false });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return this.sanitizeUser(user);
  }

  static async resetPassword(token: string, user_id: string, password: string) {
    // Find user
    const user = await User.findOne({ user_id, is_deleted: false }).select('+password_reset_token +password_reset_expires');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    if (user.password_reset_token !== tokenHash) {
      throw new AppError('Invalid reset token', 400);
    }

    // Check if token has expired
    if (!user.password_reset_expires || user.password_reset_expires < new Date()) {
      throw new AppError('Reset token has expired', 400);
    }

    // Update password and clear reset token
    user.password = password;
    user.password_reset_token = undefined;
    user.password_reset_expires = undefined;
    await user.save();

    return { message: 'Password reset successfully' };
  }

  private static async generateTokens(user: IUser) {
    const accessToken = jwt.sign(
      {
        id: user.user_id,
        email: user.email,
        role: user.role,
      },
      config.jwt_secret,
      { expiresIn: config.jwt_expires_in as `${number}${'s' | 'm' | 'h' | 'd'}` }
    );

    const refreshToken = jwt.sign(
      { user_id: user.user_id },
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
    await UserSession.create({
      session_id: uuidv4(),
      user_id,
      refresh_token: refreshToken,
      is_revoked: false,
      expires_at: new Date(Date.now() + expiresMs),
      device_info: deviceInfo,
      ip_address: ipAddress,
    });
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

  private static sanitizeUser(user: any) {
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;
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
