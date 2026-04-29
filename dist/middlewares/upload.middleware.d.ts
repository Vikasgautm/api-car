import multer from 'multer';
export interface UploadConfig {
    destination?: string;
    maxFileSize?: number;
    allowedMimeTypes?: string[];
    maxFiles?: number;
}
export declare const createUploadMiddleware: (config?: UploadConfig) => multer.Multer;
export declare const upload: multer.Multer;
export declare const uploadSingle: (fieldName: string, config?: UploadConfig) => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadMultiple: (fieldName: string, maxCount?: number, config?: UploadConfig) => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadFields: (fields: {
    name: string;
    maxCount?: number;
}[], config?: UploadConfig) => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
//# sourceMappingURL=upload.middleware.d.ts.map