"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQController = void 0;
const faq_service_1 = require("../services/faq.service");
const catchAsync_1 = require("../../../utils/catchAsync");
class FAQController {
    static getAllFAQs = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await faq_service_1.FAQService.getAllFAQs(req.query);
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
}
exports.FAQController = FAQController;
//# sourceMappingURL=faq.controller.js.map