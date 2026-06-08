import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../../types/auth';
import { AdminChatbotService } from '../services/adminChatbot.service';
import { chatbotAskSchema, chatbotActionSchema } from '../validation/adminChatbot.validation';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { AppError } from '../../../shared/utils/app-error.util';
import type { ChatbotRequest, ChatbotActionRequest } from '../types/adminChatbot.types';

export class AdminChatbotController {
  static async ask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(AppError.unauthorized('You are not authorized to use admin chatbot.'));
      }

      const parsed = chatbotAskSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(AppError.validation(parsed.error.issues.map((e: { message: string }) => e.message).join(', ')));
      }

      const { question, sessionId, context, conversationHistory, page, limit } = parsed.data;

      const chatReq: ChatbotRequest = {
        question,
        sessionId,
        context,
        conversationHistory,
        page,
        limit,
      };

      const result = await AdminChatbotService.ask(
        chatReq,
        req.user.user_id || req.user.id,
        req.user.role,
      );

      ResponseUtil.success(res, result, 'Chatbot response');
    } catch (err) {
      next(err);
    }
  }

  static async performAction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(AppError.unauthorized('You are not authorized to use admin chatbot.'));
      }

      const parsed = chatbotActionSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(AppError.validation(parsed.error.issues.map((e: { message: string }) => e.message).join(', ')));
      }

      const actionReq: ChatbotActionRequest = parsed.data;

      const result = await AdminChatbotService.performAction(
        actionReq,
        req.user.user_id || req.user.id,
        req.user.role,
      );

      ResponseUtil.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }
}
