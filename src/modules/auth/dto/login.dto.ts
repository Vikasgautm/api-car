export class LoginDto {
  email!: string;
  password!: string;

  static validate(dto: LoginDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!dto.email || !dto.email.includes('@')) {
      errors.push('Please provide a valid email');
    }

    if (!dto.password || dto.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    return { valid: errors.length === 0, errors };
  }
}
