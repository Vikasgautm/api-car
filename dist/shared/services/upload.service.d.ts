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
    static createS3Storage(configObj: UploadConfig): StorageEngine;
    static createLocalStorage(uploadPath?: string): StorageEngine;
    static createFileFilter(config: UploadConfig): (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => void;
    static createUploadMiddleware(configObj: UploadConfig): (req: Request, res: any, next: any) => void;
    static deleteFromS3(key: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    static deleteLocalFile(filePath: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    static formatUploadedFile(file: Express.Multer.File): UploadedFile;
    static cleanupFailedUpload(uploadedFile: UploadedFile): Promise<void>;
    static cleanupFailedUploads(uploadedFiles: UploadedFile[]): Promise<void>;
}
export default UploadService;
