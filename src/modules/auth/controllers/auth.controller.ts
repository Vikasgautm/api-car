import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../shared/utils/app-error.util';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { AuthRequest } from '../../../types/auth';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const registerDto: RegisterDto = req.body;
      
      // Validate DTO
      const validation = RegisterDto.validate(registerDto);
      if (!validation.valid) {
        throw new AppError(validation.errors.join(', '), 400);
      }

      const result = await AuthService.register(registerDto);
      return ResponseUtil.created(res, result, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const loginDto: LoginDto = req.body;
      
      // Validate DTO
      const validation = LoginDto.validate(loginDto);
      if (!validation.valid) {
        throw new AppError(validation.errors.join(', '), 400);
      }

      const result = await AuthService.login(loginDto, req);
      return ResponseUtil.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshTokenDto: RefreshTokenDto = req.body;
      
      // Validate DTO
      const validation = RefreshTokenDto.validate(refreshTokenDto);
      if (!validation.valid) {
        throw new AppError(validation.errors.join(', '), 400);
      }

      const result = await AuthService.refreshToken(refreshTokenDto);
      return ResponseUtil.success(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      const user_id = user?.user_id || user?.id;
      if (!user_id) {
        throw new AppError('User not authenticated', 401);
      }

      const result = await AuthService.logout(user_id);
      return ResponseUtil.success(res, result, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      const user_id = user?.user_id || user?.id;
      if (!user_id) {
        throw new AppError('User not authenticated', 401);
      }

      const userProfile = await AuthService.getProfile(user_id);
      return ResponseUtil.success(res, userProfile, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, user_id, password } = req.body;

      if (!token || !user_id || !password) {
        throw new AppError('Token, user_id, and password are required', 400);
      }

      if (password.length < 8) {
        throw new AppError('Password must be at least 8 characters', 400);
      }

      const result = await AuthService.resetPassword(token, user_id, password);
      return ResponseUtil.success(res, result, 'Password reset successfully');
    } catch (error) {
      next(error);
    }
  }
}
