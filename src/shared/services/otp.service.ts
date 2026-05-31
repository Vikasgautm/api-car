import bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { AppError } from '../utils/app-error.util';

export class OtpService {
  /**
   * Generate a numeric OTP of `digits` digits (default 6). Uses `crypto.randomInt`
   * for uniform distribution — Math.random is not acceptable for security tokens.
   */
  static generate(digits = 6): string {
    if (digits < 4 || digits > 8) {
      throw AppError.internal('OTP digits must be between 4 and 8');
    }
    const min = 10 ** (digits - 1);
    const max = 10 ** digits;
    return String(randomInt(min, max));
  }

  static async hash(otp: string): Promise<string> {
    return bcrypt.hash(otp, 10);
  }

  static async verify(otp: string, hash: string): Promise<boolean> {
    if (!otp || !hash) return false;
    return bcrypt.compare(otp, hash);
  }
}
