import { Request, Response } from 'express';
import { FAQService } from '../services/faq.service';
import { catchAsync } from '../../../utils/catchAsync';

export class FAQController {
  static getAllFAQs = catchAsync(async (req: Request, res: Response) => {
    const result = await FAQService.getAllFAQs(req.query);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  static createFAQ = catchAsync(async (req: Request, res: Response) => {
    const faq = await FAQService.createFAQ(req.body);
    res.status(201).json({
      status: 'success',
      data: { faq },
    });
  });
}
