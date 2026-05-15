import { RedirectType } from '../../../models/redirect.model';

export class UpdateRedirectDto {
  old_url?: string;
  new_url?: string;
  type?: RedirectType;
  reason?: string | null;

  static validate(dto: UpdateRedirectDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (dto.old_url !== undefined && !dto.old_url.startsWith('/')) {
      errors.push('old_url must start with "/" (path only, no origin)');
    }
    if (dto.new_url !== undefined && !dto.new_url.startsWith('/')) {
      errors.push('new_url must start with "/" (path only, no origin)');
    }
    if (dto.old_url && dto.new_url && dto.old_url.trim() === dto.new_url.trim()) {
      errors.push('old_url and new_url must differ');
    }
    if (dto.type !== undefined && dto.type !== '301' && dto.type !== '302') {
      errors.push('type must be "301" or "302"');
    }
    if (dto.reason !== undefined && dto.reason !== null && dto.reason.length > 500) {
      errors.push('reason must not exceed 500 characters');
    }

    return { valid: errors.length === 0, errors };
  }
}
