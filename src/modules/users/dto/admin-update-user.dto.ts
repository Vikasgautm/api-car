import { UserRole } from '../../../models/user.model';
import { ValidationUtil } from '../../../shared/utils/validation.util';

export class AdminUpdateUserDto {
  user_name?: string;
  email?: string;
  phone?: string;
  profile_pic?: string;
  role?: UserRole;
  is_email_verified?: boolean;
  theme?: string;
  is_active?: boolean;

  static validate(dto: AdminUpdateUserDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (dto.user_name !== undefined) {
      const nameResult = ValidationUtil.minLength(dto.user_name, 2, 'user_name');
      if (!nameResult.valid) errors.push(...nameResult.errors);
    }

    if (dto.email !== undefined) {
      const emailResult = ValidationUtil.email(dto.email);
      if (!emailResult.valid) errors.push(...emailResult.errors);
    }

    if (dto.phone !== undefined && dto.phone.length > 0) {
      if (dto.phone.length < 10) {
        errors.push('Phone number must be at least 10 characters');
      }
    }

    if (dto.role !== undefined) {
      const validRoles = Object.values(UserRole);
      if (!validRoles.includes(dto.role)) {
        errors.push(`Role must be one of: ${validRoles.join(', ')}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
