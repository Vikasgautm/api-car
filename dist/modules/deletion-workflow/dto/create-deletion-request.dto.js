"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDeletionRequestDto = void 0;
const validation_util_1 = require("../../../shared/utils/validation.util");
class CreateDeletionRequestDto {
    entity_type;
    entity_id;
    action;
    reason;
    redirect_to_slug;
    static validate(dto) {
        const errors = [];
        const allowedEntities = ['car'];
        if (!dto.entity_type || !allowedEntities.includes(dto.entity_type)) {
            errors.push(`entity_type must be one of: ${allowedEntities.join(', ')}`);
        }
        const idResult = validation_util_1.ValidationUtil.required(dto.entity_id, 'entity_id');
        if (!idResult.valid)
            errors.push(...idResult.errors);
        const allowedActions = ['archive', 'disable', 'discontinue', 'hard_delete'];
        if (!dto.action || !allowedActions.includes(dto.action)) {
            errors.push(`action must be one of: ${allowedActions.join(', ')}`);
        }
        if (dto.reason !== undefined && dto.reason.length > 500) {
            errors.push('reason must not exceed 500 characters');
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.CreateDeletionRequestDto = CreateDeletionRequestDto;
//# sourceMappingURL=create-deletion-request.dto.js.map