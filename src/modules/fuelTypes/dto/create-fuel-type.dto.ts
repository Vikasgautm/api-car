import { ValidationUtil } from '../../../shared/utils/validation.util';

export class CreateFuelTypeDto {
  name!: string;
  description?: string;
  is_published?: boolean;
  is_featured?: boolean;

  static validate(dto: CreateFuelTypeDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const nameResult = ValidationUtil.required(dto.name, 'name');
    if (!nameResult.valid) errors.push(...nameResult.errors);

    const nameLengthResult = ValidationUtil.minLength(dto.name, 2, 'name');
    if (!nameLengthResult.valid) errors.push(...nameLengthResult.errors);

    if (dto.description !== undefined) {
      const descResult = ValidationUtil.maxLength(dto.description, 8000, 'description');
      if (!descResult.valid) errors.push(...descResult.errors);
    }

    return { valid: errors.length === 0, errors };
  }
}
