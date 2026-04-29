export declare class PaginationDto {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    static validate(dto: PaginationDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=pagination.dto.d.ts.map