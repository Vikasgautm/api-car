import { UserRole } from '../../../models/user.model';
export declare class AdminUpdateUserDto {
    user_name?: string;
    email?: string;
    phone?: string;
    profile_pic?: string;
    role?: UserRole;
    is_email_verified?: boolean;
    theme?: string;
    is_active?: boolean;
    static validate(dto: AdminUpdateUserDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=admin-update-user.dto.d.ts.map