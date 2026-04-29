import { Request, Response } from 'express';
import { AppError } from '../../../shared/utils/app-error.util';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { CreateFaqDto } from '../dto/create-faq.dto';
import { UpdateFaqDto } from '../dto/update-faq.dto';
import { FAQService } from '../services/faq.service';

export class FAQController {
  // Public routes
  static getAllPublicFAQs = catchAsync(async (req: Request, res: Response) => {
    const filterDto = {
      ...req.query,
      is_published: true,
    };
    const result = await FAQService.getAllFAQs(filterDto, false);
    return ResponseUtil.paginated(res, result.faqs, result.pagination, 'FAQs retrieved successfully');
  });

  static getPublicFAQById = catchAsync(async (req: Request, res: Response) => {
    const faq = await FAQService.getFAQById(req.params.id as string);
    if (!faq) {
      throw new AppError('FAQ not found', 404);
    }
    return ResponseUtil.success(res, faq, 'FAQ retrieved successfully');
  });

  static getFAQsByGroup = catchAsync(async (req: Request, res: Response) => {
    const faqs = await FAQService.getFAQsByGroup(req.params.groupName as string);
    return ResponseUtil.success(res, faqs, 'FAQs retrieved successfully');
  });

  static getFeaturedFAQs = catchAsync(async (req: Request, res: Response) => {
    const faqs = await FAQService.getFeaturedFAQs();
    return ResponseUtil.success(res, faqs, 'Featured FAQs retrieved successfully');
  });

  static getFAQsByTag = catchAsync(async (req: Request, res: Response) => {
    const faqs = await FAQService.getFAQsByTag(req.params.tag as string);
    return ResponseUtil.success(res, faqs, 'FAQs retrieved successfully');
  });

  static incrementViewCount = catchAsync(async (req: Request, res: Response) => {
    const faq = await FAQService.incrementViewCount(req.params.id as string);
    return ResponseUtil.success(res, faq, 'View count incremented successfully');
  });

  // Admin routes
  static getAllAdminFAQs = catchAsync(async (req: Request, res: Response) => {
    const result = await FAQService.getAllFAQs(req.query, true);
    return ResponseUtil.paginated(res, result.faqs, result.pagination, 'FAQs retrieved successfully');
  });

  static getAdminFAQById = catchAsync(async (req: Request, res: Response) => {
    const faq = await FAQService.getFAQById(req.params.id as string);
    if (!faq) {
      throw new AppError('FAQ not found', 404);
    }
    return ResponseUtil.success(res, faq, 'FAQ retrieved successfully');
  });

  static createFAQ = catchAsync(async (req: Request, res: Response) => {
    const createDto: CreateFaqDto = {
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

    const validation = CreateFaqDto.validate(createDto);
    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    const faq = await FAQService.createFAQ(createDto);
    return ResponseUtil.created(res, faq, 'FAQ created successfully');
  });

  static updateFAQ = catchAsync(async (req: Request, res: Response) => {
    const updateDto: UpdateFaqDto = {
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

    const validation = UpdateFaqDto.validate(updateDto);
    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    const faq = await FAQService.updateFAQ(req.params.id as string, updateDto);
    return ResponseUtil.success(res, faq, 'FAQ updated successfully');
  });

  static deleteFAQ = catchAsync(async (req: Request, res: Response) => {
    await FAQService.deleteFAQ(req.params.id as string);
    return ResponseUtil.success(res, null, 'FAQ deleted successfully');
  });

  static restoreFAQ = catchAsync(async (req: Request, res: Response) => {
    const faq = await FAQService.restoreFAQ(req.params.id as string);
    return ResponseUtil.success(res, faq, 'FAQ restored successfully');
  });

  static togglePublish = catchAsync(async (req: Request, res: Response) => {
    const faq = await FAQService.togglePublish(req.params.id as string);
    return ResponseUtil.success(res, faq, 'FAQ publish status toggled successfully');
  });
}
