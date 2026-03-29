import { Request, Response } from "express";
export declare class BlogController {
    static getAllBlogs: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getAllBlogsAdmin: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getBlogBySlug: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createBlog: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateBlog: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteBlog: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static togglePublish: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static uploadImage: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=blog.controller.d.ts.map