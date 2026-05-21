import path from 'path';
import {
  ALLOWED_AUTOMOTIVE_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  REJECTED_MIME_TYPES,
  REJECTED_EXTENSIONS,
  SVG_ALLOWED_MIME_TYPES,
  SVG_EXTENSIONS,
  SUBCATEGORIES_BY_CATEGORY,
  MainCategory,
} from './media-constants';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export class MediaValidationService {
  static validateAutomotiveFile(file: Express.Multer.File): FileValidationResult {
    const mime = file.mimetype.toLowerCase();
    const ext = path.extname(file.originalname).toLowerCase();

    if (REJECTED_MIME_TYPES.includes(mime as any) || REJECTED_EXTENSIONS.includes(ext as any)) {
      return { valid: false, error: `File type "${mime}" is not allowed. Rejected format.` };
    }

    if (SVG_ALLOWED_MIME_TYPES.includes(mime as any) || SVG_EXTENSIONS.includes(ext as any)) {
      return { valid: false, error: 'SVG is only allowed for brand logos and icons, not automotive images.' };
    }

    const mimeOk = ALLOWED_AUTOMOTIVE_MIME_TYPES.includes(mime as any);
    const extOk = ALLOWED_EXTENSIONS.includes(ext as any);

    if (!mimeOk || !extOk) {
      return {
        valid: false,
        error: `Invalid file type "${mime}" (${ext}). Allowed: avif, webp, png, jpeg, jpg.`,
      };
    }

    return { valid: true };
  }

  static validateBrandLogoFile(file: Express.Multer.File): FileValidationResult {
    const mime = file.mimetype.toLowerCase();
    const ext = path.extname(file.originalname).toLowerCase();

    const allowed = [
      ...ALLOWED_AUTOMOTIVE_MIME_TYPES,
      ...SVG_ALLOWED_MIME_TYPES,
    ];
    const allowedExts = [...ALLOWED_EXTENSIONS, ...SVG_EXTENSIONS];

    if (!allowed.includes(mime as any) || !allowedExts.includes(ext as any)) {
      return { valid: false, error: `Invalid file type for logo. Allowed: svg, avif, webp, png, jpeg, jpg.` };
    }

    return { valid: true };
  }

  static validateSubCategory(mainCategory: MainCategory, subCategory: string): FileValidationResult {
    const allowed = SUBCATEGORIES_BY_CATEGORY[mainCategory];
    if (!allowed) {
      return { valid: false, error: `Invalid main_category: ${mainCategory}` };
    }
    if (!allowed.includes(subCategory)) {
      return {
        valid: false,
        error: `"${subCategory}" is not a valid sub_category for "${mainCategory}". Allowed: ${allowed.join(', ')}.`,
      };
    }
    return { valid: true };
  }
}
