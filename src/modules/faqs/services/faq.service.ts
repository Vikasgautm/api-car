import { v4 as uuidv4 } from "uuid";
import { FAQ } from "../../../models/faq.model";

export class FAQService {
  static async getAllFAQs(query: any, fetchAsAdmin = false) {
    const {
      category,
      car_id,
      tag,
      faq_group,
      page = 1,
      limit = 10,
      is_deleted,
      sortBy = 'order',
      sortOrder = 'asc',
    } = query;
    const filter: any = { is_deleted: is_deleted === "true" };
    if (!fetchAsAdmin && is_deleted !== "true") {
      filter.is_published = true;
    }

    if (category) filter.category = category;
    if (tag) filter.tags = { $in: [tag] };
    if (faq_group) filter.faq_group = faq_group;
    if (car_id) filter.related_cars = { $in: [car_id] };

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const faqs = await FAQ.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));
    const total = await FAQ.countDocuments(filter);

    return { faqs, total, page: Number(page), limit: Number(limit) };
  }

  static async getFAQsByGroup(groupName: string) {
    return await FAQ.find({ faq_group: groupName, is_published: true, is_deleted: false })
      .sort({ order: 1 });
  }

  static async getFeaturedFAQs() {
    return await FAQ.find({ is_featured: true, is_published: true, is_deleted: false })
      .sort({ order: 1, view_count: -1 })
      .limit(10);
  }

  static async getFAQsByTag(tag: string) {
    return await FAQ.find({ tags: tag, is_published: true, is_deleted: false })
      .sort({ view_count: -1 });
  }

  static async incrementViewCount(id: string) {
    return await FAQ.findOneAndUpdate(
      { faq_id: id },
      { $inc: { view_count: 1 } },
      { returnDocument: "after" },
    );
  }

  static async togglePublish(id: string) {
    const faq = await FAQ.findOne({ faq_id: id });
    if (!faq) return null;
    return await FAQ.findOneAndUpdate(
      { faq_id: id },
      { is_published: !faq.is_published },
      { returnDocument: "after" },
    );
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
      order: faqData.order || 0,
      tags: faqData.tags || [],
      answer_format: faqData.answer_format || 'text',
      view_count: 0,
      related_cars: faqData.related_cars || [],
      related_brands: faqData.related_brands || [],
      related_blogs: faqData.related_blogs || [],
      is_featured: faqData.is_featured || false,
    });
  }
}
