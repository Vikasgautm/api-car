"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQController = void 0;
const faq_service_1 = require("../services/faq.service");
const catchAsync_1 = require("../../../utils/catchAsync");
const error_middleware_1 = require("../../../middlewares/error.middleware");
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
        const faq = await faq_service_1.FAQService.createFAQ(req.body);
        res.status(201).json({
            status: 'success',
            data: { faq },
        });
    });
    static updateFAQ = (0, catchAsync_1.catchAsync)(async (req, res) => {
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
}
exports.FAQController = FAQController;
//# sourceMappingURL=faq.controller.js.map