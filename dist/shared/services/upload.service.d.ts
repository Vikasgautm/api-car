import { Request } from 'express';
import { FileFilterCallback, StorageEngine } from 'multer';
export interface UploadConfig {
    fieldName: string;
    maxFileSize?: number;
    allowedMimeTypes?: string[];
    maxFiles?: number;
    useCloudinary?: boolean;
    folder?: string;
    fields?: Array<{
        name: string;
        maxCount: number;
    }>;
}
export interface UploadedFile {
    url: string;
    publicId?: string;
    originalName: string;
    mimeType: string;
    size: number;
}
export declare class UploadService {
    private static readonly DEFAULT_MAX_FILE_SIZE;
    private static readonly DEFAULT_ALLOWED_MIME_TYPES;
    private static readonly MIME_TYPE_MAP;
    static getMimeType(mimeType: string): string;
    static createCloudinaryStorage(config: UploadConfig): StorageEngine;
    static createLocalStorage(uploadPath?: string): StorageEngine;
    static createFileFilter(config: UploadConfig): (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => void;
    static createUploadMiddleware(config: UploadConfig): import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    static deleteFromCloudinary(publicId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    static deleteLocalFile(filePath: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    static formatUploadedFile(file: Express.Multer.File): UploadedFile;
    /**
     * Cleanup uploaded files if database operation fails
     * This should be called in a catch block after failed DB operations
     */
    static cleanupFailedUpload(uploadedFile: UploadedFile): Promise<void>;
    /**
     * Cleanup multiple uploaded files if database operation fails
     */
    static cleanupFailedUploads(uploadedFiles: UploadedFile[]): Promise<void>;
}
export default UploadService;
//# sourceMappingURL=upload.service.d.ts.map