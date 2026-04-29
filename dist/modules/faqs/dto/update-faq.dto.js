"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFaqDto = void 0;
class UpdateFaqDto {
    question;
    answer;
    category;
    order;
    tags;
    answer_format;
    faq_group;
    related_cars;
    related_brands;
    related_blogs;
    is_published;
    is_featured;
    static validate(dto) {
        const errors = [];
        if (dto.question && dto.question.length < 10) {
            errors.push('question must be at least 10 characters long');
        }
        if (dto.answer && dto.answer.length < 20) {
            errors.push('answer must be at least 20 characters long');
        }
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
exports.UpdateFaqDto = UpdateFaqDto;
//# sourceMappingURL=update-faq.dto.js.map