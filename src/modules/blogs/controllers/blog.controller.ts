import { Request, Response } from "express";
import { BlogService } from "../services/blog.service";
import { catchAsync } from "../../../utils/catchAsync";
import { AppError } from "../../../middlewares/error.middleware";
import { generateBlogMetadata } from "../../../utils/seo";
import { is } from "zod/v4/locales";
interface MulterRequest extends Request {
  files?: {
    [fieldname: string]: Express.Multer.File[];
  };
}

export class BlogController {
  static getAllBlogs = catchAsync(async (req: Request, res: Response) => {
    const result = await BlogService.getAllBlogs(req.query);
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

  // static createBlog = catchAsync(async (req: Request, res: Response) => {
  //   const blog = await BlogService.createBlog(req.body);
  //   res.status(201).json({
  //     status: "success",
  //     data: { blog },
  //   });
  // });
  static createBlog = catchAsync(async (req: MulterRequest, res: Response) => {
    let thumbnail = {
      url: "",
      title: req.body.thumbnailTitle || "",
    };

    let link = req.body.link || "";

    if (req.files?.["thumbnail"]) {
      const file = req.files["thumbnail"][0];
      thumbnail.url = file.path;
    }

    // Link image upload (optional)
    if (req.files?.["linkImage"]) {
      const file = req.files["linkImage"][0];
      link = file.path;
    }

    const blog = await BlogService.createBlog({
      title: req.body.title,
      content: req.body.content,
      author: req.body.author,
      slug: req.body.slug,
      link,
      thumbnail,
      // is_published: req.body.is_published === "true",
      is_published: req.body.is_published,
    });

    res.status(201).json({
      status: "success",
      data: { blog },
    });
  });

  static togglePublish = async (req: Request, res: Response) => {
    const blog = await BlogService.findBlogById(req.params.blog_id as string);

    // blog.is_published = !blog.is_published;
    // await blog.save();

    res.json({ status: "success", data: blog });
  };

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
