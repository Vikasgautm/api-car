export declare enum UserRole {
    SUPER_ADMIN = "super_admin",
    ADMIN = "admin",
    EDITOR = "editor",
    USER = "user"
}
export declare class RegisterDto {
    user_name: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
    static validate(dto: RegisterDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=register.dto.d.ts.map