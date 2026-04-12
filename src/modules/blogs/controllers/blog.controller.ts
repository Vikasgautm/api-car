import { Request, Response } from "express";
import { AppError } from "../../../middlewares/error.middleware";
import { catchAsync } from "../../../utils/catchAsync";
import { generateBlogMetadata } from "../../../utils/seo";
import { BlogService } from "../services/blog.service";

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
      preview: "",
    };
    let images: string[] = [];

    let link = req.body.link || "";

    if (req.files?.["thumbnail"]) {
      const file = req.files["thumbnail"][0];
      thumbnail.url = file.path;
      thumbnail.title = req.body.thumbnailTitle || "";
    }

    if (req.files?.["linkImage"]) {
      const file = req.files["linkImage"][0];
      link = file.path;
    }
    if (req.files?.images) {
      images = req.files.images.map((file: any) => file.path);
    }

    const blog = await BlogService.createBlog({
      title: req.body.title,
      content: req.body.content,
      author: req.body.author,
      category: req.body.category || "Uncategorized",
      slug: req.body.slug,
      link,
      thumbnail,
      images,
      is_published:
        req.body.is_published === "true" || req.body.is_published === true,
      // SEO fields
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
      og_image: req.body.og_image,
      canonical_url: req.body.canonical_url,
      noindex: req.body.noindex === "true",
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
        // url: file.path,
        url: file.path.replace(/\\/g, "/"),
        title: req.body.thumbnailTitle || "",
        preview: "",
      };
    }

    if (req.files?.["linkImage"]) {
      const file = req.files["linkImage"][0];
      blogData.link = file.path;
    }
    // keep existing images if no new uploaded
    if (req.body.keptImages || req.files?.["images"]) {
      let finalImages: string[] = [];

      // Keep existing images that were not removed
      if (req.body.keptImages) {
        try {
          finalImages = JSON.parse(req.body.keptImages);
        } catch {
          finalImages = [];
        }
      }

      // Add newly uploaded images
      if (req.files?.["images"]) {
        const newPaths = req.files.images.map((file: any) => file.path);
        finalImages = [...finalImages, ...newPaths];
      }

      blogData.images = finalImages;
    }
    // if (req.files?.images) {
    //   blogData.images = req.files.images.map((file: any) => file.path);
    // }

    // convert string to boolean
    if (typeof req.body.is_published !== "undefined") {
      blogData.is_published =
        req.body.is_published === "true" || req.body.is_published === true;
    }
    if (typeof req.body.noindex !== "undefined") {
      blogData.noindex =
        req.body.noindex === "true" || req.body.noindex === true;
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
      message: "Blog deleted successfully",
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

    // FIX: convert backslash to forward slash
    const filePath = req.file.path.replace(/\\/g, "/");

    const url = `${req.protocol}://${req.get("host")}/${filePath}`;

    res.json({ url });
  });
  // static uploadImage = catchAsync(async (req: Request, res: Response) => {
  //   if (!req.file) {
  //     return res.status(400).json({
  //       status: "fail",
  //       message: "No file uploaded",
  //     });
  //   }
  //   const url = `${req.protocol}://${req.get("host")}/${req.file.path}`;
  //   res.json({ url });

  //   // res.status(200).json({
  //   //   status: "success",
  //   //   url: req.file.path,
  //   // });
  // });
}
