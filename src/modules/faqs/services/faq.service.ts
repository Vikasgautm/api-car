import { FAQ } from "../../../models/faq.model";
import { v4 as uuidv4 } from "uuid";

export class FAQService {
  static async getAllFAQs(query: any, fetchAsAdmin = false) {
    const { category, car_id, page = 1, limit = 10, is_deleted } = query;
    const filter: any = { is_deleted: is_deleted === "true" };
    if (!fetchAsAdmin && is_deleted !== "true") {
      filter.is_published = true;
    }

    if (category) filter.category = category;
    if (car_id) filter.car_id = car_id;

    const skip = (Number(page) - 1) * Number(limit);
    const faqs = await FAQ.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await FAQ.countDocuments(filter);

    return { faqs, total, page: Number(page), limit: Number(limit) };
  }

  static async updateFAQ(id: string, faqData: any) {
    return await FAQ.findOneAndUpdate({ faq_id: id }, faqData, {
      returnDocument: "after",
    });
  }

  static async deleteFAQ(id: string) {
    return await FAQ.findOneAndUpdate(
      { faq_id: id },
      { is_deleted: true },
      { returnDocument: "after" },
    );
  }

  static async restoreFAQ(id: string) {
    return await FAQ.findOneAndUpdate(
      { faq_id: id },
      { is_deleted: false },
      { returnDocument: "after" },
    );
  }

  static async createFAQ(faqData: any) {
    const faq_id = uuidv4();

    return await FAQ.create({
      ...faqData,
      faq_id,
    });
  }
}
