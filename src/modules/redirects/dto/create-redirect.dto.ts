import { ValidationUtil } from '../../../shared/utils/validation.util';
import { RedirectType } from '../../../models/redirect.model';

export class CreateRedirectDto {
  old_url!: string;
  new_url!: string;
  type?: RedirectType;
  reason?: string;

  static validate(dto: CreateRedirectDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const oldResult = ValidationUtil.required(dto.old_url, 'old_url');
    if (!oldResult.valid) errors.push(...oldResult.errors);
    const newResult = ValidationUtil.required(dto.new_url, 'new_url');
    if (!newResult.valid) errors.push(...newResult.errors);

    if (dto.old_url && !dto.old_url.startsWith('/')) {
      errors.push('old_url must start with "/" (path only, no origin)');
    }
    if (dto.new_url && !dto.new_url.startsWith('/')) {
      errors.push('new_url must start with "/" (path only, no origin)');
    }
    if (dto.old_url && dto.new_url && dto.old_url.trim() === dto.new_url.trim()) {
      errors.push('old_url and new_url must differ');
    }
    if (dto.type !== undefined && dto.type !== '301' && dto.type !== '302') {
      errors.push('type must be "301" or "302"');
    }
    if (dto.reason !== undefined && dto.reason.length > 500) {
      errors.push('reason must not exceed 500 characters');
    }

    return { valid: errors.length === 0, errors };
  }
}
