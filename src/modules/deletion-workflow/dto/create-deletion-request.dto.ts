import { DeletionAction, DeletionEntityType } from '../../../models/deletion-request.model';
import { ValidationUtil } from '../../../shared/utils/validation.util';

export class CreateDeletionRequestDto {
  entity_type!: DeletionEntityType;
  entity_id!: string;
  action!: DeletionAction;
  reason?: string;
  redirect_to_slug?: string;

  static validate(dto: CreateDeletionRequestDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const allowedEntities: DeletionEntityType[] = ['car'];
    if (!dto.entity_type || !allowedEntities.includes(dto.entity_type)) {
      errors.push(`entity_type must be one of: ${allowedEntities.join(', ')}`);
    }

    const idResult = ValidationUtil.required(dto.entity_id, 'entity_id');
    if (!idResult.valid) errors.push(...idResult.errors);

    const allowedActions: DeletionAction[] = ['archive', 'disable', 'discontinue', 'hard_delete'];
    if (!dto.action || !allowedActions.includes(dto.action)) {
      errors.push(`action must be one of: ${allowedActions.join(', ')}`);
    }

    if (dto.reason !== undefined && dto.reason.length > 500) {
      errors.push('reason must not exceed 500 characters');
    }

    return { valid: errors.length === 0, errors };
  }
}
