export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  EDITOR = 'editor',
  USER = 'user',
}

export class RegisterDto {
  user_name!: string;
  email!: string;
  password!: string;
  phone?: string;
  role?: UserRole = UserRole.USER;

  static validate(dto: RegisterDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const validRoles = Object.values(UserRole);

    if (!dto.user_name || dto.user_name.length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (!dto.email || !dto.email.includes('@')) {
      errors.push('Please provide a valid email');
    }

    if (!dto.password || dto.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    if (dto.role && !validRoles.includes(dto.role)) {
      errors.push('Invalid role');
    }

    return { valid: errors.length === 0, errors };
  }
}
