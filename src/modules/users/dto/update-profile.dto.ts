import { ValidationUtil } from '../../../shared/utils/validation.util';

export class UpdateProfileDto {
  user_name?: string;
  phone?: string;
  profile_pic?: string;

  static validate(dto: UpdateProfileDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (dto.user_name !== undefined) {
      const nameResult = ValidationUtil.minLength(dto.user_name, 2, 'user_name');
      if (!nameResult.valid) errors.push(...nameResult.errors);
    }

    if (dto.phone !== undefined) {
      if (dto.phone.length > 0 && dto.phone.length < 10) {
        errors.push('Phone number must be at least 10 characters');
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
