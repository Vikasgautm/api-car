export declare class UserFilterDto {
    page?: number;
    limit?: number;
    role?: string;
    is_email_verified?: boolean | string;
    is_active?: boolean | string;
    q?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    is_deleted?: boolean;
    static validate(dto: UserFilterDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=user-filter.dto.d.ts.map