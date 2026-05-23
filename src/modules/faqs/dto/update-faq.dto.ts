const VALID_FAQ_TYPES = ['editorial', 'specification', 'feature', 'performance', 'safety', 'dimensions', 'comparison', 'ownership', 'upcoming', 'collection', 'aggregation'];
const VALID_ENTITY_TYPES = ['car', 'variant', 'brand', 'body_type', 'fuel_type', 'comparison', 'seo_collection', 'global'];
const VALID_VISIBILITY = ['visible', 'hidden', 'scheduled'];
const VALID_SOURCE_TYPES = ['manual', 'template', 'ai', 'import'];

export class UpdateFaqDto {
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

  // Intelligence fields
  faq_type?: string;
  intent_type?: string;
  entity_type?: string;
  entity_id?: string;
  related_entities?: Array<{ entity_type: string; entity_id: string }>;
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

  static validate(dto: UpdateFaqDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (dto.question && dto.question.length < 10) errors.push('question must be at least 10 characters long');
    if (dto.answer && dto.answer.length < 20) errors.push('answer must be at least 20 characters long');
    if (dto.category && dto.category.length < 2) errors.push('category must be at least 2 characters long');

    if (dto.answer_format && !['text', 'html', 'markdown'].includes(dto.answer_format)) {
      errors.push('answer_format must be one of: text, html, markdown');
    }

    if (dto.order !== undefined && dto.order < 0) errors.push('order must be a positive number');

    if (dto.tags && !Array.isArray(dto.tags)) errors.push('tags must be an array');
    if (dto.tags && dto.tags.length > 20) errors.push('tags cannot have more than 20 items');
    if (dto.tags) {
      for (const tag of dto.tags) {
        if (typeof tag !== 'string' || tag.length < 2) {
          errors.push('each tag must be a string with at least 2 characters');
          break;
        }
      }
    }

    if (dto.faq_group && typeof dto.faq_group !== 'string') errors.push('faq_group must be a string');
    if (dto.faq_group && dto.faq_group.length < 2) errors.push('faq_group must be at least 2 characters long');
    if (dto.is_featured !== undefined && typeof dto.is_featured !== 'boolean') errors.push('is_featured must be a boolean');

    if (dto.faq_type && !VALID_FAQ_TYPES.includes(dto.faq_type)) {
      errors.push(`faq_type must be one of: ${VALID_FAQ_TYPES.join(', ')}`);
    }
    if (dto.entity_type && !VALID_ENTITY_TYPES.includes(dto.entity_type)) {
      errors.push(`entity_type must be one of: ${VALID_ENTITY_TYPES.join(', ')}`);
    }
    if (dto.visibility_status && !VALID_VISIBILITY.includes(dto.visibility_status)) {
      errors.push(`visibility_status must be one of: ${VALID_VISIBILITY.join(', ')}`);
    }
    if (dto.source_type && !VALID_SOURCE_TYPES.includes(dto.source_type)) {
      errors.push(`source_type must be one of: ${VALID_SOURCE_TYPES.join(', ')}`);
    }
    if (dto.priority_score !== undefined && (dto.priority_score < 0 || dto.priority_score > 100)) {
      errors.push('priority_score must be between 0 and 100');
    }

    return { valid: errors.length === 0, errors };
  }
}
