"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQController = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const faq_model_1 = require("../../../models/faq.model");
const catchAsync_1 = require("../../../utils/catchAsync");
const faq_service_1 = require("../services/faq.service");
class FAQController {
    static getAllFAQs = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const isAdmin = req.user && ["admin", "superadmin"].includes(req.user.role);
        const fetchAsAdmin = isAdmin || req.query.admin === "true";
        const result = await faq_service_1.FAQService.getAllFAQs(req.query, fetchAsAdmin);
        res.status(200).json({
            status: 'success',
            data: result,
        });
    });
    static createFAQ = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { category, answer_format } = req.body;
        // Validate category
        if (category && !Object.values(faq_model_1.FAQCategory).includes(category)) {
            throw new error_middleware_1.AppError('Invalid category. Must be one of: ' + Object.values(faq_model_1.FAQCategory).join(', '), 400);
        }
        // Validate answer format
        if (answer_format && !Object.values(faq_model_1.AnswerFormat).includes(answer_format)) {
            throw new error_middleware_1.AppError('Invalid answer format. Must be one of: ' + Object.values(faq_model_1.AnswerFormat).join(', '), 400);
        }
        const faq = await faq_service_1.FAQService.createFAQ(req.body);
        res.status(201).json({
            status: 'success',
            data: { faq },
        });
    });
    static updateFAQ = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { category, answer_format } = req.body;
        // Validate category if provided
        if (category && !Object.values(faq_model_1.FAQCategory).includes(category)) {
            throw new error_middleware_1.AppError('Invalid category. Must be one of: ' + Object.values(faq_model_1.FAQCategory).join(', '), 400);
        }
        // Validate answer format if provided
        if (answer_format && !Object.values(faq_model_1.AnswerFormat).includes(answer_format)) {
            throw new error_middleware_1.AppError('Invalid answer format. Must be one of: ' + Object.values(faq_model_1.AnswerFormat).join(', '), 400);
        }
        const faq = await faq_service_1.FAQService.updateFAQ(req.params.id, req.body);
        if (!faq)
            throw new error_middleware_1.AppError('FAQ not found', 404);
        res.status(200).json({
            status: 'success',
            data: { faq },
        });
    });
    static deleteFAQ = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faq = await faq_service_1.FAQService.deleteFAQ(req.params.id);
        if (!faq)
            throw new error_middleware_1.AppError('FAQ not found', 404);
        res.status(200).json({
            status: 'success',
            message: 'FAQ soft deleted successfully',
        });
    });
    static restoreFAQ = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faq = await faq_service_1.FAQService.restoreFAQ(req.params.id);
        if (!faq)
            throw new error_middleware_1.AppError('FAQ not found', 404);
        res.status(200).json({
            status: 'success',
            message: 'FAQ restored successfully',
            data: { faq },
        });
    });
    static incrementViewCount = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faq = await faq_service_1.FAQService.incrementViewCount(req.params.id);
        if (!faq)
            throw new error_middleware_1.AppError('FAQ not found', 404);
        res.status(200).json({
            status: 'success',
            data: { faq },
        });
    });
    static togglePublish = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faq = await faq_service_1.FAQService.togglePublish(req.params.id);
        if (!faq)
            throw new error_middleware_1.AppError('FAQ not found', 404);
        res.status(200).json({
            status: 'success',
            data: { faq },
        });
    });
    static getFAQsByGroup = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faqs = await faq_service_1.FAQService.getFAQsByGroup(req.params.groupName);
        res.status(200).json({
            status: 'success',
            data: { faqs },
        });
    });
    static getFeaturedFAQs = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faqs = await faq_service_1.FAQService.getFeaturedFAQs();
        res.status(200).json({
            status: 'success',
            data: { faqs },
        });
    });
    static getFAQsByTag = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faqs = await faq_service_1.FAQService.getFAQsByTag(req.params.tag);
        res.status(200).json({
            status: 'success',
            data: { faqs },
        });
    });
}
exports.FAQController = FAQController;
//# sourceMappingURL=faq.controller.js.map