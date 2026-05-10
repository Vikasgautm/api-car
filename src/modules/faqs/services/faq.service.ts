import { v4 as uuidv4 } from "uuid";
import { FAQ, IFAQ } from "../../../models/faq.model";
import { AppError } from "../../../shared/utils/app-error.util";
import { FilterUtil } from "../../../shared/utils/filter.util";
import { PaginationUtil } from "../../../shared/utils/pagination.util";
import { SlugUtil } from "../../../shared/utils/slug.util";

export class FAQService {
  static async getAllFAQs(filterDto: any, includeDeleted: boolean = false) {
    const {
      page = 1,
      limit = 10,
      category,
      car_id,
      tag,
      faq_group,
      is_published,
      is_featured,
      is_deleted,
      sortBy = 'order',
      sortOrder = 'asc',
      q,
    } = filterDto;

    const filter: Record<string, unknown> = {};

    if (is_deleted === 'true' || is_deleted === true) {
      filter.is_deleted = true;
    } else if (!includeDeleted) {
      filter.is_deleted = false;
    }

    if (is_published !== undefined) {
      filter.is_published = is_published;
    }

    if (is_featured !== undefined) {
      filter.is_featured = is_featured;
    }

    if (category !== undefined) {
      filter.category = category;
    }

    if (tag !== undefined) {
      filter.tags = { $in: [tag] };
    }

    if (faq_group !== undefined) {
      filter.faq_group = faq_group;
    }

    if (car_id !== undefined) {
      filter.related_cars = { $in: [car_id] };
    }

    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);
    const sortFilter = FilterUtil.buildSortFilter(sortBy, sortOrder);

    let query = FAQ.find(filter);

    if (q && typeof q === 'string' && q.trim()) {
      query = FAQ.find({
        $and: [
          filter,
          {
            $or: [
              { question: { $regex: q.trim(), $options: 'i' } },
              { answer: { $regex: q.trim(), $options: 'i' } },
            ],
          },
        ],
      });
    }

    const faqs = await query
      .sort(sortFilter)
      .skip(skip)
      .limit(validatedLimit);

    const total = await FAQ.countDocuments(filter);
    const paginationMeta = PaginationUtil.createPaginationMeta(page, validatedLimit, total);

    return { faqs, pagination: paginationMeta };
  }

  static async getFAQById(faqId: string) {
    return await FAQ.findOne({ faq_id: faqId, is_deleted: false });
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

  static async incrementViewCount(faqId: string) {
    const faq = await FAQ.findOneAndUpdate(
      { faq_id: faqId, is_deleted: false },
      { $inc: { view_count: 1 } },
      { returnDocument: 'after' }
    );

    if (!faq) {
      throw new AppError('FAQ not found', 404);
    }

    return faq;
  }

  static async togglePublish(faqId: string) {
    const faq = await FAQ.findOne({ faq_id: faqId, is_deleted: false });
    if (!faq) {
      throw new AppError('FAQ not found', 404);
    }

    faq.is_published = !faq.is_published;
    await faq.save();

    return faq;
  }

  static async createFAQ(faqData: any) {
    const faq_id = uuidv4();
    const slug = SlugUtil.generate(faqData.question);

    const existingSlug = await FAQ.findOne({ slug, is_deleted: false });
    if (existingSlug) {
      const existingSlugs = (await FAQ.find({ is_deleted: false }).select('slug')).map(f => f.slug);
      const uniqueSlug = SlugUtil.generateUnique(faqData.question, existingSlugs);
      faqData.slug = uniqueSlug;
    } else {
      faqData.slug = slug;
    }

    const faq: Partial<IFAQ> = {
      faq_id,
      question: faqData.question,
      answer: faqData.answer,
      category: faqData.category,
      order: faqData.order || 0,
      tags: faqData.tags || [],
      answer_format: faqData.answer_format || 'text',
      faq_group: faqData.faq_group,
      related_cars: faqData.related_cars,
      related_brands: faqData.related_brands,
      related_blogs: faqData.related_blogs,
      is_published: faqData.is_published || false,
      is_featured: faqData.is_featured || false,
      is_deleted: false,
      slug: faqData.slug,
      view_count: 0,
    };

    return await FAQ.create(faq);
  }

  static async updateFAQ(faqId: string, faqData: any) {
    const updateData: Partial<IFAQ> = {};

    if (faqData.question !== undefined) {
      updateData.question = faqData.question;
      const newSlug = SlugUtil.generate(faqData.question);
      const existingSlug = await FAQ.findOne({ slug: newSlug, faq_id: { $ne: faqId }, is_deleted: false });
      if (!existingSlug) {
        updateData.slug = newSlug;
      }
    }

    if (faqData.answer !== undefined) updateData.answer = faqData.answer;
    if (faqData.category !== undefined) updateData.category = faqData.category;
    if (faqData.order !== undefined) updateData.order = faqData.order;
    if (faqData.tags !== undefined) updateData.tags = faqData.tags;
    if (faqData.answer_format !== undefined) updateData.answer_format = faqData.answer_format;
    if (faqData.faq_group !== undefined) updateData.faq_group = faqData.faq_group;
    if (faqData.related_cars !== undefined) updateData.related_cars = faqData.related_cars;
    if (faqData.related_brands !== undefined) updateData.related_brands = faqData.related_brands;
    if (faqData.related_blogs !== undefined) updateData.related_blogs = faqData.related_blogs;
    if (faqData.is_published !== undefined) updateData.is_published = faqData.is_published;
    if (faqData.is_featured !== undefined) updateData.is_featured = faqData.is_featured;

    const faq = await FAQ.findOneAndUpdate(
      { faq_id: faqId, is_deleted: false },
      updateData,
      { returnDocument: 'after' }
    );

    if (!faq) {
      throw new AppError('FAQ not found', 404);
    }

    return faq;
  }

  static async deleteFAQ(faqId: string) {
    const faq = await FAQ.findOneAndUpdate(
      { faq_id: faqId, is_deleted: false },
      { is_deleted: true },
      { returnDocument: 'after' }
    );

    if (!faq) {
      throw new AppError('FAQ not found', 404);
    }

    return faq;
  }

  static async restoreFAQ(faqId: string) {
    const faq = await FAQ.findOneAndUpdate(
      { faq_id: faqId, is_deleted: true },
      { is_deleted: false },
      { returnDocument: 'after' }
    );

    if (!faq) {
      throw new AppError('FAQ not found', 404);
    }

    return faq;
  }
}
