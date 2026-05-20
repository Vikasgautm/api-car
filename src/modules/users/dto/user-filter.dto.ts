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

    if (dto.page !== undefined) {
      const page = typeof dto.page === 'string' ? parseInt(dto.page, 10) : dto.page;
      if (isNaN(page) || page < 1 || !Number.isInteger(page)) {
        errors.push('Page must be a positive integer');
      }
    }

    if (dto.limit !== undefined) {
      const limit = typeof dto.limit === 'string' ? parseInt(dto.limit, 10) : dto.limit;
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        errors.push('Limit must be between 1 and 1000');
      }
    }

    if (dto.sortOrder !== undefined && !['asc', 'desc'].includes(dto.sortOrder)) {
      errors.push('Sort order must be either "asc" or "desc"');
    }

    return { valid: errors.length === 0, errors };
  }
}
