import { DeletionAction, DeletionEntityType } from '../../../models/deletion-request.model';
export declare class CreateDeletionRequestDto {
    entity_type: DeletionEntityType;
    entity_id: string;
    action: DeletionAction;
    reason?: string;
    redirect_to_slug?: string;
    static validate(dto: CreateDeletionRequestDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=create-deletion-request.dto.d.ts.map