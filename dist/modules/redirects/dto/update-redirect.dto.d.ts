import { RedirectType } from '../../../models/redirect.model';
export declare class UpdateRedirectDto {
    old_url?: string;
    new_url?: string;
    type?: RedirectType;
    reason?: string | null;
    static validate(dto: UpdateRedirectDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=update-redirect.dto.d.ts.map