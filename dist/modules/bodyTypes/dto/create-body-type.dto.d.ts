export declare class CreateBodyTypeDto {
    name: string;
    description?: string;
    is_published?: boolean;
    is_featured?: boolean;
    logo_url?: string;
    logo_title?: string;
    static validate(dto: CreateBodyTypeDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=create-body-type.dto.d.ts.map