export class PaginationDto {
  page?: number = 1;
  limit?: number = 10;
  sortBy?: string = 'createdAt';
  sortOrder?: 'asc' | 'desc' = 'desc';
  search?: string;

  static validate(dto: PaginationDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (dto.page !== undefined && (dto.page < 1 || !Number.isInteger(dto.page))) {
      errors.push('Page must be a positive integer');
    }

    if (dto.limit !== undefined) {
      if (!Number.isInteger(dto.limit) || dto.limit < 1) {
        errors.push('Limit must be a positive integer');
      } else if (dto.limit > 100) {
        errors.push('Limit cannot exceed 100');
      }
    }

    if (dto.sortOrder && !['asc', 'desc'].includes(dto.sortOrder)) {
      errors.push('Sort order must be either asc or desc');
    }

    return { valid: errors.length === 0, errors };
  }
}
