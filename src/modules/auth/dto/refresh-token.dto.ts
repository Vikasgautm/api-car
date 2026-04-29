export class RefreshTokenDto {
  refresh_token!: string;

  static validate(dto: RefreshTokenDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!dto.refresh_token) {
      errors.push('Refresh token is required');
    }

    return { valid: errors.length === 0, errors };
  }
}
