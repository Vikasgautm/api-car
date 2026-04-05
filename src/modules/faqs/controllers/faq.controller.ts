import { Request, Response } from 'express';
import { AuthRequest } from '../../../types/auth';
import { FAQService } from '../services/faq.service';
import { catchAsync } from '../../../utils/catchAsync';
import { AppError } from '../../../middlewares/error.middleware';

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
    const faq = await FAQService.createFAQ(req.body);
    res.status(201).json({
      status: 'success',
      data: { faq },
    });
  });

  static updateFAQ = catchAsync<AuthRequest>(async (req, res) => {
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
}
