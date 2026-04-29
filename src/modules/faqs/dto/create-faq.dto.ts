import { ValidationUtil } from '../../../shared/utils/validation.util';

export class CreateFaqDto {
  question!: string;
  answer!: string;
  category!: string;
  order?: number;
  tags?: string[];
  answer_format?: 'text' | 'html' | 'markdown';
  faq_group?: string;
  related_cars?: string[];
  related_brands?: string[];
  related_blogs?: string[];
  is_published?: boolean;
  is_featured?: boolean;

  static validate(dto: CreateFaqDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const questionResult = ValidationUtil.required(dto.question, 'question');
    if (!questionResult.valid) errors.push(...questionResult.errors);

    if (dto.question && dto.question.length < 10) {
      errors.push('question must be at least 10 characters long');
    }

    const answerResult = ValidationUtil.required(dto.answer, 'answer');
    if (!answerResult.valid) errors.push(...answerResult.errors);

    if (dto.answer && dto.answer.length < 20) {
      errors.push('answer must be at least 20 characters long');
    }

    const categoryResult = ValidationUtil.required(dto.category, 'category');
    if (!categoryResult.valid) errors.push(...categoryResult.errors);

    if (dto.category && dto.category.length < 2) {
      errors.push('category must be at least 2 characters long');
    }

    if (dto.answer_format && !['text', 'html', 'markdown'].includes(dto.answer_format)) {
      errors.push('answer_format must be one of: text, html, markdown');
    }

    if (dto.order !== undefined && dto.order < 0) {
      errors.push('order must be a positive number');
    }

    if (dto.tags && !Array.isArray(dto.tags)) {
      errors.push('tags must be an array');
    }

    if (dto.tags && dto.tags.length > 20) {
      errors.push('tags cannot have more than 20 items');
    }

    if (dto.tags) {
      for (const tag of dto.tags) {
        if (typeof tag !== 'string' || tag.length < 2) {
          errors.push('each tag must be a string with at least 2 characters');
          break;
        }
      }
    }

    if (dto.faq_group && typeof dto.faq_group !== 'string') {
      errors.push('faq_group must be a string');
    }

    if (dto.faq_group && dto.faq_group.length < 2) {
      errors.push('faq_group must be at least 2 characters long');
    }

    if (dto.is_featured !== undefined && typeof dto.is_featured !== 'boolean') {
      errors.push('is_featured must be a boolean');
    }

    return { valid: errors.length === 0, errors };
  }
}
