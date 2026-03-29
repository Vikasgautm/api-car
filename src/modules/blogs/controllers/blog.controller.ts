import { Request, Response } from "express";
import { BlogService } from "../services/blog.service";
import { catchAsync } from "../../../utils/catchAsync";
import { AppError } from "../../../middlewares/error.middleware";
import { generateBlogMetadata } from "../../../utils/seo";

interface MulterRequest extends Request {
  files?: {
    [fieldname: string]: Express.Multer.File[];
  };
}

export class BlogController {
  static getAllBlogs = catchAsync(async (req: Request, res: Response) => {
    // Public route, only fetch published
    const result = await BlogService.getAllBlogs(req.query, false);
    res.status(200).json({
      status: "success",
      data: result,
    });
  });

  static getAllBlogsAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await BlogService.getAllBlogs(req.query, true);
    res.status(200).json({
      status: "success",
      data: result,
    });
  });

  static getBlogBySlug = catchAsync(async (req: Request, res: Response) => {
    const blog = await BlogService.getBlogBySlug(req.params.slug as string);
    if (!blog) {
      throw new AppError("Blog not found", 404);
    }

    const metadata = generateBlogMetadata(blog);

    res.status(200).json({
      status: "success",
      data: {
        blog,
        seo: metadata,
      },
    });
  });

  static createBlog = catchAsync(async (req: MulterRequest, res: Response) => {
    let thumbnail = {
      url: "",
      title: req.body.thumbnailTitle || "",
      preview: ""
    };

    let link = req.body.link || "";

    if (req.files?.["thumbnail"]) {
      const file = req.files["thumbnail"][0];
      thumbnail.url = file.path;
    }

    if (req.files?.["linkImage"]) {
      const file = req.files["linkImage"][0];
      link = file.path;
    }

    const blog = await BlogService.createBlog({
      title: req.body.title,
      content: req.body.content,
      author: req.body.author,
      category: req.body.category || "Uncategorized",
      slug: req.body.slug,
      link,
      thumbnail,
      is_published: req.body.is_published === "true" || req.body.is_published === true,
    });

    res.status(201).json({
      status: "success",
      data: { blog },
    });
  });
  
  static updateBlog = catchAsync(async (req: MulterRequest, res: Response) => {
    const id = req.params.id as string;
    let blogData = { ...req.body };
    
    if (req.files?.["thumbnail"]) {
      const file = req.files["thumbnail"][0];
      blogData.thumbnail = {
        url: file.path,
        title: req.body.thumbnailTitle || "",
        preview: ""
      };
    }
    
    if (req.files?.["linkImage"]) {
      const file = req.files["linkImage"][0];
      blogData.link = file.path;
    }
    
    // convert string to boolean
    if(typeof req.body.is_published !== "undefined") {
       blogData.is_published = req.body.is_published === "true" || req.body.is_published === true;
    }

    const updatedBlog = await BlogService.updateBlog(id, blogData);
    if (!updatedBlog) {
       throw new AppError("Blog not found", 404);
    }

    res.status(200).json({
      status: "success",
      data: { blog: updatedBlog },
    });
  });

  static deleteBlog = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const deletedBlog = await BlogService.deleteBlog(id);
    
    if (!deletedBlog) {
       throw new AppError("Blog not found", 404);
    }

    res.status(200).json({
      status: "success",
      message: "Blog deleted successfully"
    });
  });

  static togglePublish = catchAsync(async (req: Request, res: Response) => {
    const blog = await BlogService.findBlogById(req.params.id as string);
    if (!blog) {
       throw new AppError("Blog not found", 404);
    }

    blog.is_published = !blog.is_published;
    await blog.save();

    res.json({ status: "success", data: blog });
  });

  static uploadImage = catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        status: "fail",
        message: "No file uploaded",
      });
    }

    res.status(200).json({
      status: "success",
      url: req.file.path,
    });
  });
}
