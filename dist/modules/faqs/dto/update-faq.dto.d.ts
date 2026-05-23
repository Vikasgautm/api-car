export declare class UpdateFaqDto {
    question?: string;
    answer?: string;
    category?: string;
    order?: number;
    tags?: string[];
    answer_format?: 'text' | 'html' | 'markdown';
    faq_group?: string;
    related_cars?: string[];
    related_brands?: string[];
    related_blogs?: string[];
    is_published?: boolean;
    is_featured?: boolean;
    faq_type?: string;
    intent_type?: string;
    entity_type?: string;
    entity_id?: string;
    related_entities?: Array<{
        entity_type: string;
        entity_id: string;
    }>;
    target_page_types?: string[];
    template_key?: string;
    is_dynamic?: boolean;
    is_editorial?: boolean;
    canonical_intent_key?: string;
    indexable?: boolean;
    schema_enabled?: boolean;
    priority_score?: number;
    visibility_status?: string;
    needs_refresh?: boolean;
    source_type?: string;
    static validate(dto: UpdateFaqDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=update-faq.dto.d.ts.map