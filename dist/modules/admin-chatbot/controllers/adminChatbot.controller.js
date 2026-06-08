"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminChatbotController = void 0;
const adminChatbot_service_1 = require("../services/adminChatbot.service");
const adminChatbot_validation_1 = require("../validation/adminChatbot.validation");
const response_util_1 = require("../../../shared/utils/response.util");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
class AdminChatbotController {
    static async ask(req, res, next) {
        try {
            if (!req.user) {
                return next(app_error_util_1.AppError.unauthorized('You are not authorized to use admin chatbot.'));
            }
            const parsed = adminChatbot_validation_1.chatbotAskSchema.safeParse(req.body);
            if (!parsed.success) {
                return next(app_error_util_1.AppError.validation(parsed.error.issues.map((e) => e.message).join(', ')));
            }
            const { question, sessionId, context, conversationHistory, page, limit } = parsed.data;
            const chatReq = {
                question,
                sessionId,
                context,
                conversationHistory,
                page,
                limit,
            };
            const result = await adminChatbot_service_1.AdminChatbotService.ask(chatReq, req.user.user_id || req.user.id, req.user.role);
            response_util_1.ResponseUtil.success(res, result, 'Chatbot response');
        }
        catch (err) {
            next(err);
        }
    }
    static async performAction(req, res, next) {
        try {
            if (!req.user) {
                return next(app_error_util_1.AppError.unauthorized('You are not authorized to use admin chatbot.'));
            }
            const parsed = adminChatbot_validation_1.chatbotActionSchema.safeParse(req.body);
            if (!parsed.success) {
                return next(app_error_util_1.AppError.validation(parsed.error.issues.map((e) => e.message).join(', ')));
            }
            const actionReq = parsed.data;
            const result = await adminChatbot_service_1.AdminChatbotService.performAction(actionReq, req.user.user_id || req.user.id, req.user.role);
            response_util_1.ResponseUtil.success(res, result, result.message);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AdminChatbotController = AdminChatbotController;
//# sourceMappingURL=adminChatbot.controller.js.map