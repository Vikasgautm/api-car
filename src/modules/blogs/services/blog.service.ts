import { Blog } from "../../../models/blog.model";
import { v4 as uuidv4 } from "uuid";
import { generateSlug } from "../../../utils/slugify";

export class BlogService {
  static async getAllBlogs(query: any) {
    const { q, page = 1, limit = 10 } = query;
    const filter: any = { is_deleted: false, is_published: true };

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const blogs = await Blog.find(filter).skip(skip).limit(Number(limit));
    const total = await Blog.countDocuments(filter);

    return { blogs, total, page, limit };
  }

  static async getBlogBySlug(slug: string) {
    return await Blog.findOne({ slug, is_deleted: false, is_published: true });
  }
  static async findBlogById(blog_id: string) {
    const blog = await Blog.findById(blog_id);
    if (blog) {
      blog.is_published = true;
      await blog.save();
    }
    return blog;
  }

  static async createBlog(blogData: any) {
    const blog_id = uuidv4();
    const slug = generateSlug(blogData.title);

    return await Blog.create({
      ...blogData,
      blog_id,
      slug,
    });
  }
}
