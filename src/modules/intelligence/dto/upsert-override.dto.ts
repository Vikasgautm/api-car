import { ValidationUtil } from '../../../shared/utils/validation.util';

export class UpsertBenchmarkOverrideDto {
  weak_max!: number;
  average_max!: number;
  good_max!: number;

  static validate(dto: UpsertBenchmarkOverrideDto): { success: boolean; error?: { errors: { message: string }[] } } {
    const errors: string[] = [];

    const fields: Array<['weak_max' | 'average_max' | 'good_max']> = [['weak_max'], ['average_max'], ['good_max']];
    for (const [field] of fields) {
      const value = dto[field];
      if (value === undefined || value === null) {
        errors.push(`${field} is required`);
        continue;
      }
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        errors.push(`${field} must be a finite number`);
        continue;
      }
      const minResult = ValidationUtil.min(value, 0, field);
      if (!minResult.valid) errors.push(...minResult.errors);
    }

    if (errors.length === 0) {
      if (!(dto.weak_max < dto.average_max && dto.average_max < dto.good_max)) {
        errors.push('Thresholds must be strictly increasing: weak_max < average_max < good_max');
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: {
          errors: errors.map(msg => ({ message: msg }))
        }
      };
    }
    return { success: true };
  }
}
