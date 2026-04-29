export declare class CreateFaqDto {
    question: string;
    answer: string;
    category: string;
    order?: number;
    tags?: string[];
    answer_format?: 'text' | 'html' | 'markdown';
    faq_group?: string;
    related_cars?: string[];
    related_brands?: string[];
    related_blogs?: string[];
    is_published?: boolean;
    is_featured?: boolean;
    static validate(dto: CreateFaqDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=create-faq.dto.d.ts.map