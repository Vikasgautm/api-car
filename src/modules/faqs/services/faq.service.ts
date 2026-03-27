import { FAQ } from '../../../models/faq.model';
import { v4 as uuidv4 } from 'uuid';

export class FAQService {
  static async getAllFAQs(query: any) {
    const { category, car_id, page = 1, limit = 10 } = query;
    const filter: any = { is_deleted: false, is_published: true };

    if (category) filter.category = category;
    if (car_id) filter.car_id = car_id;

    const skip = (page - 1) * limit;
    const faqs = await FAQ.find(filter).skip(skip).limit(Number(limit));
    const total = await FAQ.countDocuments(filter);

    return { faqs, total, page, limit };
  }

  static async createFAQ(faqData: any) {
    const faq_id = uuidv4();
    
    return await FAQ.create({
      ...faqData,
      faq_id,
    });
  }
}
