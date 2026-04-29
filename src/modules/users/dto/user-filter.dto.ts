export class UserFilterDto {
  page?: number;
  limit?: number;
  role?: string;
  is_email_verified?: boolean | string;
  is_active?: boolean | string;
  q?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  is_deleted?: boolean;

  static validate(dto: UserFilterDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (dto.page !== undefined && (dto.page < 1 || !Number.isInteger(dto.page))) {
      errors.push('Page must be a positive integer');
    }

    if (dto.limit !== undefined && (dto.limit < 1 || dto.limit > 100)) {
      errors.push('Limit must be between 1 and 100');
    }

    if (dto.sortOrder !== undefined && !['asc', 'desc'].includes(dto.sortOrder)) {
      errors.push('Sort order must be either "asc" or "desc"');
    }

    return { valid: errors.length === 0, errors };
  }
}
