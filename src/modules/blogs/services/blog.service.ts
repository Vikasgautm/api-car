import { Blog } from "../../../models/blog.model";
import { v4 as uuidv4 } from "uuid";
import { generateSlug } from "../../../utils/slugify";
import { v2 as cloudinary } from "cloudinary";

export class BlogService {
  static async getAllBlogs(query: any, isAdmin = false) {
    const { q, category, page = 1, limit = 10 } = query;
    const filter: any = { is_deleted: false };

    if (!isAdmin) {
      filter.is_published = true;
    }

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    const skip = ((Number(page) || 1) - 1) * (Number(limit) || 10);
    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit) || 10);
    const total = await Blog.countDocuments(filter);

    return {
      blogs,
      total,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    };
  }

  static async getBlogBySlug(slug: string) {
    return await Blog.findOne({ slug, is_deleted: false, is_published: true });
  }

  static async findBlogById(id: string) {
    return await Blog.findById(id);
  }

  static async createBlog(blogData: any) {
    const blog_id = uuidv4();
    let slug = generateSlug(blogData.title);

    // Ensure unique slug
    const existing = await Blog.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    let excerpt = blogData.excerpt;
    if (!excerpt && blogData.content) {
      excerpt =
        blogData.content.replace(/<[^>]+>/g, "").substring(0, 150) + "...";
    }

    return await Blog.create({
      ...blogData,
      excerpt,
      blog_id,
      slug,
    });
  }

  static async updateBlog(id: string, blogData: any) {
    if (blogData.title) {
      blogData.slug = generateSlug(blogData.title);
    }
    if (!blogData.excerpt && blogData.content) {
      blogData.excerpt =
        blogData.content.replace(/<[^>]+>/g, "").substring(0, 150) + "...";
    }
    return await Blog.findByIdAndUpdate(id, blogData, {
      returnDocument: "after",
    });
  }

  // static async deleteBlog(id: string) {
  //   const blog = await Blog.findById(id);
  //   if (blog) {
  //     if (blog.thumbnail?.url) {
  //       const publicIdMatch = blog.thumbnail.url.match(/\/v\d+\/(.+?)\.\w+$/);
  //       if (publicIdMatch && publicIdMatch[1]) {
  //         try {
  //           await cloudinary.uploader.destroy(publicIdMatch[1]);
  //         } catch (e) {
  //           console.error("Cloudinary delete error:", e);
  //         }
  //       }
  //     }
  //     return await Blog.findByIdAndDelete(id);
  //   }
  //   return null;
  // }
  static async deleteBlog(id: string) {
    // Soft Delete - sirf is_deleted flag update kar rahe hain
    const blog = await Blog.findByIdAndUpdate(
      id,
      {
        is_deleted: true,
        deletedAt: new Date(), // optional but recommended
      },
      { returnDocument: "after" },
    );

    return blog;
  }
}
