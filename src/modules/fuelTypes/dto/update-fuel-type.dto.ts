import { ValidationUtil } from '../../../shared/utils/validation.util';

export class UpdateFuelTypeDto {
  name?: string;
  description?: string;
  is_published?: boolean;
  is_featured?: boolean;

  static validate(dto: UpdateFuelTypeDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (dto.name !== undefined) {
      const nameLengthResult = ValidationUtil.minLength(dto.name, 2, 'name');
      if (!nameLengthResult.valid) errors.push(...nameLengthResult.errors);
    }

    if (dto.description !== undefined) {
      const descResult = ValidationUtil.maxLength(dto.description, 500, 'description');
      if (!descResult.valid) errors.push(...descResult.errors);
    }

    return { valid: errors.length === 0, errors };
  }
}
