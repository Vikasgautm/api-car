export class RefreshTokenDto {
  refreshToken!: string;

  static validate(dto: RefreshTokenDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!dto.refreshToken) {
      errors.push('Refresh token is required');
    }

    return { valid: errors.length === 0, errors };
  }
}
