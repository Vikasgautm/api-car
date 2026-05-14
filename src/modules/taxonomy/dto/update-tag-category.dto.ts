import { ValidationUtil } from '../../../shared/utils/validation.util';

export class UpdateTagCategoryDto {
  name?: string;
  type?: string;
  description?: string;
  is_published?: boolean;
  sort_order?: number;

  static validate(dto: UpdateTagCategoryDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (dto.name !== undefined) {
      const nameLen = ValidationUtil.minLength(dto.name, 2, 'name');
      if (!nameLen.valid) errors.push(...nameLen.errors);
    }

    if (dto.description !== undefined) {
      const descLen = ValidationUtil.maxLength(dto.description, 2000, 'description');
      if (!descLen.valid) errors.push(...descLen.errors);
    }

    return { valid: errors.length === 0, errors };
  }
}
