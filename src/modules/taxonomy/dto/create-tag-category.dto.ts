import { ValidationUtil } from '../../../shared/utils/validation.util';

export class CreateTagCategoryDto {
  name!: string;
  type!: string;
  description?: string;
  is_published?: boolean;
  sort_order?: number;

  static validate(dto: CreateTagCategoryDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const nameRequired = ValidationUtil.required(dto.name, 'name');
    if (!nameRequired.valid) errors.push(...nameRequired.errors);
    else {
      const nameLen = ValidationUtil.minLength(dto.name, 2, 'name');
      if (!nameLen.valid) errors.push(...nameLen.errors);
    }

    const typeRequired = ValidationUtil.required(dto.type, 'type');
    if (!typeRequired.valid) errors.push(...typeRequired.errors);

    if (dto.description !== undefined) {
      const descLen = ValidationUtil.maxLength(dto.description, 2000, 'description');
      if (!descLen.valid) errors.push(...descLen.errors);
    }

    return { valid: errors.length === 0, errors };
  }
}
