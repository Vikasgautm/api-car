"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQController = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const create_faq_dto_1 = require("../dto/create-faq.dto");
const update_faq_dto_1 = require("../dto/update-faq.dto");
const faq_service_1 = require("../services/faq.service");
class FAQController {
    // Public routes
    static getAllPublicFAQs = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const filterDto = {
            ...req.query,
            is_published: true,
        };
        const result = await faq_service_1.FAQService.getAllFAQs(filterDto, false);
        return response_util_1.ResponseUtil.paginated(res, result.faqs, result.pagination, 'FAQs retrieved successfully');
    });
    static getPublicFAQById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faq = await faq_service_1.FAQService.getFAQById(req.params.id);
        if (!faq) {
            throw new app_error_util_1.AppError('FAQ not found', 404);
        }
        return response_util_1.ResponseUtil.success(res, faq, 'FAQ retrieved successfully');
    });
    static getFAQsByGroup = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faqs = await faq_service_1.FAQService.getFAQsByGroup(req.params.groupName);
        return response_util_1.ResponseUtil.success(res, faqs, 'FAQs retrieved successfully');
    });
    static getFeaturedFAQs = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faqs = await faq_service_1.FAQService.getFeaturedFAQs();
        return response_util_1.ResponseUtil.success(res, faqs, 'Featured FAQs retrieved successfully');
    });
    static getFAQsByTag = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faqs = await faq_service_1.FAQService.getFAQsByTag(req.params.tag);
        return response_util_1.ResponseUtil.success(res, faqs, 'FAQs retrieved successfully');
    });
    static incrementViewCount = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faq = await faq_service_1.FAQService.incrementViewCount(req.params.id);
        return response_util_1.ResponseUtil.success(res, faq, 'View count incremented successfully');
    });
    // Admin routes
    static getAllAdminFAQs = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const includeDeleted = req.query.include_deleted === 'true';
        const result = await faq_service_1.FAQService.getAllFAQs(req.query, includeDeleted);
        return response_util_1.ResponseUtil.paginated(res, result.faqs, result.pagination, 'FAQs retrieved successfully');
    });
    static getAdminFAQById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faq = await faq_service_1.FAQService.getFAQById(req.params.id);
        if (!faq) {
            throw new app_error_util_1.AppError('FAQ not found', 404);
        }
        return response_util_1.ResponseUtil.success(res, faq, 'FAQ retrieved successfully');
    });
    static createFAQ = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const createDto = {
            question: req.body.question,
            answer: req.body.answer,
            category: req.body.category,
            order: req.body.order,
            tags: req.body.tags,
            answer_format: req.body.answer_format,
            faq_group: req.body.faq_group,
            related_cars: req.body.related_cars,
            related_brands: req.body.related_brands,
            related_blogs: req.body.related_blogs,
            is_published: req.body.is_published,
            is_featured: req.body.is_featured,
        };
        const validation = create_faq_dto_1.CreateFaqDto.validate(createDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
        }
        const faq = await faq_service_1.FAQService.createFAQ(createDto);
        return response_util_1.ResponseUtil.created(res, faq, 'FAQ created successfully');
    });
    static updateFAQ = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const updateDto = {
            question: req.body.question,
            answer: req.body.answer,
            category: req.body.category,
            order: req.body.order,
            tags: req.body.tags,
            answer_format: req.body.answer_format,
            faq_group: req.body.faq_group,
            related_cars: req.body.related_cars,
            related_brands: req.body.related_brands,
            related_blogs: req.body.related_blogs,
            is_published: req.body.is_published !== undefined ? req.body.is_published === 'true' || req.body.is_published === true : undefined,
            is_featured: req.body.is_featured !== undefined ? req.body.is_featured === 'true' || req.body.is_featured === true : undefined,
        };
        const validation = update_faq_dto_1.UpdateFaqDto.validate(updateDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
        }
        const faq = await faq_service_1.FAQService.updateFAQ(req.params.id, updateDto);
        return response_util_1.ResponseUtil.success(res, faq, 'FAQ updated successfully');
    });
    static deleteFAQ = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faq = await faq_service_1.FAQService.deleteFAQ(req.params.id);
        return response_util_1.ResponseUtil.success(res, faq, 'FAQ deleted successfully');
    });
    static restoreFAQ = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faq = await faq_service_1.FAQService.restoreFAQ(req.params.id);
        return response_util_1.ResponseUtil.success(res, faq, 'FAQ restored successfully');
    });
    static togglePublish = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faq = await faq_service_1.FAQService.togglePublish(req.params.id);
        return response_util_1.ResponseUtil.success(res, faq, 'FAQ publish status toggled successfully');
    });
}
exports.FAQController = FAQController;
//# sourceMappingURL=faq.controller.js.map