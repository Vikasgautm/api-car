import multer, { StorageEngine } from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import { Request } from "express";
import dotenv from "dotenv";
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

// Define MIME type mapping
const mimeTypes: Record<string, string> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/tiff": "tiff",
  "application/pdf": "pdf",
};

// Set up Cloudinary Storage
const storage: StorageEngine = new CloudinaryStorage({
  cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    return {
      folder: "CarSalahakar",
      format: mimeTypes[file.mimetype] || "png", // fallback
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

// Multer upload middleware
const upload = multer({ storage });

export default upload;
