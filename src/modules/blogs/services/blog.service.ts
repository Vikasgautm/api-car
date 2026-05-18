const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);
import { v4 as uuidv4 } from "uuid";
import { ERROR_CODES, USER_MESSAGES } from "../../../constants/errorMessages";
import { Blog, IBlog } from "../../../models/blog.model";
import { AppError } from "../../../shared/utils/app-error.util";
import { FilterUtil } from "../../../shared/utils/filter.util";
import { PaginationUtil } from "../../../shared/utils/pagination.util";
import { SlugUtil } from "../../../shared/utils/slug.util";

export class BlogService {
  static async getAllBlogs(filterDto: any, includeDeleted: boolean = false) {
    const {
      page = 1,
      limit = 10,
      q,
      category,
      author_id,
      tags,
      is_published,
      is_featured,
      is_deleted,
      sortBy = 'createdAt',
      sortOrder = 'desc',
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

    if (author_id !== undefined) {
      filter.author_id = author_id;
    }

    if (q) {
      const searchFilter = FilterUtil.buildSearchFilter(['title', 'excerpt', 'content'], q);
      Object.assign(filter, searchFilter);
    }

    if (tags !== undefined) {
      const tagsArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagsArray };
    }

    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);
    const sortFilter = FilterUtil.buildSortFilter(sortBy, sortOrder);

    const blogs = await Blog.find(filter)
      .select('blog_id title slug excerpt content author_name author_id category tags thumbnail link is_published is_featured createdAt updatedAt')
      .sort(sortFilter)
      .skip(skip)
      .limit(validatedLimit)
      .lean();

    const total = await Blog.countDocuments(filter);
    const paginationMeta = PaginationUtil.createPaginationMeta(page, validatedLimit, total);

    return { blogs, pagination: paginationMeta };
  }

  static async getBlogById(blogId: string) {
    return await Blog.findOne({ blog_id: blogId, is_deleted: false });
  }

  static async getBlogBySlug(slug: string) {
    return await Blog.findOne({ slug, is_deleted: false, is_published: true });
  }

  static async findBlogById(id: string) {
    return await Blog.findById(id);
  }

  static async createBlog(blogData: any) {
    const blog_id = uuidv4();
    const slug = SlugUtil.generate(blogData.title);

    const existingSlug = await Blog.findOne({ slug, is_deleted: false });
    if (existingSlug) {
      const baseSlug = slug;
      const pattern = new RegExp(`^${baseSlug}(-\\d+)?$`);
      const matchingSlugs = (
        await Blog.find({ slug: pattern, is_deleted: false }).select('slug').lean()
      ).map((b: any) => b.slug);
      const uniqueSlug = SlugUtil.generateUnique(blogData.title, matchingSlugs);
      blogData.slug = uniqueSlug;
    } else {
      blogData.slug = slug;
    }

    // Sanitize HTML content
    const sanitizedContent = blogData.content ? DOMPurify.sanitize(blogData.content) : '';

    let excerpt = blogData.excerpt;
    if (!excerpt && sanitizedContent) {
      excerpt = sanitizedContent.replace(/<[^>]+>/g, "").substring(0, 150) + "...";
    }

    const blog: Partial<IBlog> = {
      blog_id,
      title: blogData.title,
      slug: blogData.slug,
      excerpt,
      content: sanitizedContent,
      // author_name: blogData.author_name,
      // author_id: blogData.author_id,
      category: blogData.category,
      tags: blogData.tags,
      thumbnail: blogData.thumbnail_url ? {
        url: blogData.thumbnail_url,
        alt: blogData.thumbnail_alt,
      } : undefined,
      images: blogData.images,
      link: blogData.link,
      is_published: blogData.is_published || false,
      is_featured: blogData.is_featured || false,
      is_deleted: false,
      meta_title: blogData.meta_title,
      meta_description: blogData.meta_description,
      meta_keywords: blogData.meta_keywords,
      og_image: blogData.og_image,
      canonical_url: blogData.canonical_url,
      noindex: blogData.noindex,
    };

    return await Blog.create(blog);
  }

  static async updateBlog(blogId: string, blogData: any) {
    const updateData: Partial<IBlog> = {};

    if (blogData.title !== undefined) {
      updateData.title = blogData.title;
      const newSlug = SlugUtil.generate(blogData.title);
      const existingSlug = await Blog.findOne({ slug: newSlug, blog_id: { $ne: blogId }, is_deleted: false });
      if (!existingSlug) {
        updateData.slug = newSlug;
      }
    }

    if (blogData.content !== undefined) {
      // Sanitize HTML content
      const sanitizedContent = DOMPurify.sanitize(blogData.content);
      updateData.content = sanitizedContent;
      if (!blogData.excerpt) {
        updateData.excerpt = sanitizedContent.replace(/<[^>]+>/g, "").substring(0, 150) + "...";
      }
    }

    // if (blogData.author_name !== undefined) updateData.author_name = blogData.author_name;
    // if (blogData.author_id !== undefined) updateData.author_id = blogData.author_id;
    if (blogData.category !== undefined) updateData.category = blogData.category;
    if (blogData.tags !== undefined) updateData.tags = blogData.tags;
    if (blogData.thumbnail_url !== undefined) {
      updateData.thumbnail = {
        url: blogData.thumbnail_url,
        alt: blogData.thumbnail_alt,
      };
    }
    if (blogData.images !== undefined) updateData.images = blogData.images;
    if (blogData.link !== undefined) updateData.link = blogData.link;
    if (blogData.is_published !== undefined) updateData.is_published = blogData.is_published;
    if (blogData.is_featured !== undefined) updateData.is_featured = blogData.is_featured;
    if (blogData.meta_title !== undefined) updateData.meta_title = blogData.meta_title;
    if (blogData.meta_description !== undefined) updateData.meta_description = blogData.meta_description;
    if (blogData.meta_keywords !== undefined) updateData.meta_keywords = blogData.meta_keywords;
    if (blogData.og_image !== undefined) updateData.og_image = blogData.og_image;
    if (blogData.canonical_url !== undefined) updateData.canonical_url = blogData.canonical_url;
    if (blogData.noindex !== undefined) updateData.noindex = blogData.noindex;
    if (blogData.excerpt !== undefined) updateData.excerpt = blogData.excerpt;

    const blog = await Blog.findOneAndUpdate(
      { blog_id: blogId, is_deleted: false },
      updateData,
      { returnDocument: 'after' }
    );

    if (!blog) {
      throw new AppError(
        `Blog not found or deleted for blog_id: ${blogId}`,
        404,
        {
          userMessage: USER_MESSAGES.BLOG_NOT_FOUND,
          errorCode: ERROR_CODES.BLOG_NOT_FOUND,
          details: {
            field: 'blog_id',
            reason: 'The blog does not exist or has already been deleted.',
          },
        }
      );
    }

    return blog;
  }

  static async deleteBlog(blogId: string) {
    const blog = await Blog.findOneAndUpdate(
      { blog_id: blogId, is_deleted: false },
      { is_deleted: true },
      { returnDocument: 'after' }
    );

    if (!blog) {
      throw new AppError(
        `Blog not found or deleted for blog_id: ${blogId}`,
        404,
        {
          userMessage: USER_MESSAGES.BLOG_NOT_FOUND,
          errorCode: ERROR_CODES.BLOG_NOT_FOUND,
          details: {
            field: 'blog_id',
            reason: 'The blog does not exist or has already been deleted.',
          },
        }
      );
    }

    return blog;
  }

  static async restoreBlog(blogId: string) {
    const blog = await Blog.findOneAndUpdate(
      { blog_id: blogId, is_deleted: true },
      { is_deleted: false },
      { returnDocument: 'after' }
    );

    if (!blog) {
      throw new AppError(
        `Blog not found for blog_id: ${blogId}`,
        404,
        {
          userMessage: USER_MESSAGES.BLOG_NOT_FOUND,
          errorCode: ERROR_CODES.BLOG_NOT_FOUND,
          details: {
            field: 'blog_id',
            reason: 'The blog does not exist in the deleted records.',
          },
        }
      );
    }

    return blog;
  }

  static async togglePublish(blogId: string) {
    const blog = await Blog.findOne({ blog_id: blogId, is_deleted: false });
    if (!blog) {
      throw new AppError(
        `Blog not found or deleted for blog_id: ${blogId}`,
        404,
        {
          userMessage: USER_MESSAGES.BLOG_NOT_FOUND,
          errorCode: ERROR_CODES.BLOG_NOT_FOUND,
          details: {
            field: 'blog_id',
            reason: 'The blog does not exist or has been deleted.',
          },
        }
      );
    }

    blog.is_published = !blog.is_published;
    await blog.save();

    return blog;
  }
}
