import { IImage } from "../../../models/image.model";
export declare class ImageService {
    static getAllImages(filterDto: any, includeDeleted?: boolean): Promise<{
        images: (import("mongoose").Document<unknown, {}, IImage, {}, import("mongoose").DefaultSchemaOptions> & IImage & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getImageById(imageId: string): Promise<import("mongoose").Document<unknown, {}, IImage, {}, import("mongoose").DefaultSchemaOptions> & IImage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static createImage(imageData: any, uploadedBy?: string): Promise<import("mongoose").Document<unknown, {}, IImage, {}, import("mongoose").DefaultSchemaOptions> & IImage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static deleteImage(imageId: string): Promise<import("mongoose").Document<unknown, {}, IImage, {}, import("mongoose").DefaultSchemaOptions> & IImage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static restoreImage(imageId: string): Promise<import("mongoose").Document<unknown, {}, IImage, {}, import("mongoose").DefaultSchemaOptions> & IImage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static hardDeleteImage(imageId: string): Promise<import("mongoose").Document<unknown, {}, IImage, {}, import("mongoose").DefaultSchemaOptions> & IImage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateImage(imageId: string, imageData: any): Promise<import("mongoose").Document<unknown, {}, IImage, {}, import("mongoose").DefaultSchemaOptions> & IImage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static createImageWithCleanup(uploadedFile: any, additionalData?: any, uploadedBy?: string): Promise<IImage>;
    static createMultipleImagesWithCleanup(uploadedFiles: any[], additionalData?: any, uploadedBy?: string): Promise<IImage[]>;
}
//# sourceMappingURL=image.service.d.ts.map