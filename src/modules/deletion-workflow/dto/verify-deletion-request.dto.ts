export class VerifyDeletionRequestDto {
  otp!: string;

  static validate(dto: VerifyDeletionRequestDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!dto.otp || typeof dto.otp !== 'string') {
      errors.push('otp is required');
    } else if (!/^\d{4,8}$/.test(dto.otp.trim())) {
      errors.push('otp must be 4-8 digits');
    }
    return { valid: errors.length === 0, errors };
  }
}
