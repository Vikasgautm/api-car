import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, IUser } from '../../../models/user.model';
import { UserSession } from '../../../models/user-session.model';
import { config } from '../../../config';
import { AppError } from '../../../middlewares/error.middleware';

export class AuthService {
  static generateToken(user: IUser) {
    return jwt.sign(
      { id: user.user_id, role: user.role, email: user.email },
      config.jwt_secret,
      { expiresIn: config.jwt_expires_in as any }
    );
  }

  static async signup(userData: any) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError('Email already exists', 400);
    }

    const newUser = await User.create({
      ...userData,
      user_id: uuidv4(),
    });

    const token = this.generateToken(newUser);
    return { user: newUser, token };
  }

  static async login(loginData: any) {
    const user = await User.findOne({ email: loginData.email }).select('+password');
    if (!user || !(await user.comparePassword(loginData.password))) {
      throw new AppError('Incorrect email or password', 401);
    }

    const token = this.generateToken(user);
    return { user, token };
  }
}
