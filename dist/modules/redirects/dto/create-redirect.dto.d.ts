import { RedirectType } from '../../../models/redirect.model';
export declare class CreateRedirectDto {
    old_url: string;
    new_url: string;
    type?: RedirectType;
    reason?: string;
    static validate(dto: CreateRedirectDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=create-redirect.dto.d.ts.map