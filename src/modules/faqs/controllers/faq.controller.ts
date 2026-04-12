import { AppError } from '../../../middlewares/error.middleware';
import { AnswerFormat, FAQCategory } from '../../../models/faq.model';
import { AuthRequest } from '../../../types/auth';
import { catchAsync } from '../../../utils/catchAsync';
import { FAQService } from '../services/faq.service';

export class FAQController {
  static getAllFAQs = catchAsync<AuthRequest>(async (req, res) => {
    const isAdmin = req.user && ["admin", "superadmin"].includes(req.user.role);
    const fetchAsAdmin = isAdmin || req.query.admin === "true";

    const result = await FAQService.getAllFAQs(req.query, fetchAsAdmin);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  static createFAQ = catchAsync<AuthRequest>(async (req, res) => {
    const { category, answer_format } = req.body;

    // Validate category
    if (category && !Object.values(FAQCategory).includes(category)) {
      throw new AppError('Invalid category. Must be one of: ' + Object.values(FAQCategory).join(', '), 400);
    }

    // Validate answer format
    if (answer_format && !Object.values(AnswerFormat).includes(answer_format)) {
      throw new AppError('Invalid answer format. Must be one of: ' + Object.values(AnswerFormat).join(', '), 400);
    }

    const faq = await FAQService.createFAQ(req.body);
    res.status(201).json({
      status: 'success',
      data: { faq },
    });
  });

  static updateFAQ = catchAsync<AuthRequest>(async (req, res) => {
    const { category, answer_format } = req.body;

    // Validate category if provided
    if (category && !Object.values(FAQCategory).includes(category)) {
      throw new AppError('Invalid category. Must be one of: ' + Object.values(FAQCategory).join(', '), 400);
    }

    // Validate answer format if provided
    if (answer_format && !Object.values(AnswerFormat).includes(answer_format)) {
      throw new AppError('Invalid answer format. Must be one of: ' + Object.values(AnswerFormat).join(', '), 400);
    }

    const faq = await FAQService.updateFAQ(req.params.id as string, req.body);
    if (!faq) throw new AppError('FAQ not found', 404);
    res.status(200).json({
      status: 'success',
      data: { faq },
    });
  });

  static deleteFAQ = catchAsync<AuthRequest>(async (req, res) => {
    const faq = await FAQService.deleteFAQ(req.params.id as string);
    if (!faq) throw new AppError('FAQ not found', 404);
    res.status(200).json({
      status: 'success',
      message: 'FAQ soft deleted successfully',
    });
  });

  static restoreFAQ = catchAsync<AuthRequest>(async (req, res) => {
    const faq = await FAQService.restoreFAQ(req.params.id as string);
    if (!faq) throw new AppError('FAQ not found', 404);
    res.status(200).json({
      status: 'success',
      message: 'FAQ restored successfully',
      data: { faq },
    });
  });

  static incrementViewCount = catchAsync<AuthRequest>(async (req, res) => {
    const faq = await FAQService.incrementViewCount(req.params.id as string);
    if (!faq) throw new AppError('FAQ not found', 404);
    res.status(200).json({
      status: 'success',
      data: { faq },
    });
  });

  static togglePublish = catchAsync<AuthRequest>(async (req, res) => {
    const faq = await FAQService.togglePublish(req.params.id as string);
    if (!faq) throw new AppError('FAQ not found', 404);
    res.status(200).json({
      status: 'success',
      data: { faq },
    });
  });

  static getFAQsByGroup = catchAsync<AuthRequest>(async (req, res) => {
    const faqs = await FAQService.getFAQsByGroup(req.params.groupName as string);
    res.status(200).json({
      status: 'success',
      data: { faqs },
    });
  });

  static getFeaturedFAQs = catchAsync<AuthRequest>(async (req, res) => {
    const faqs = await FAQService.getFeaturedFAQs();
    res.status(200).json({
      status: 'success',
      data: { faqs },
    });
  });

  static getFAQsByTag = catchAsync<AuthRequest>(async (req, res) => {
    const faqs = await FAQService.getFAQsByTag(req.params.tag as string);
    res.status(200).json({
      status: 'success',
      data: { faqs },
    });
  });
}
