import { IImage } from "../../../models/image.model";
export declare class ImageService {
    static getAllImages(filterDto: any, includeDeleted?: boolean): Promise<{
        images: (IImage & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getImageById(imageId: string): Promise<IImage & import("../../../sql/common/BaseModel").SQLDocument>;
    static createImage(imageData: any, uploadedBy?: string): Promise<any>;
    static deleteImage(imageId: string): Promise<IImage & import("../../../sql/common/BaseModel").SQLDocument>;
    static restoreImage(imageId: string): Promise<IImage & import("../../../sql/common/BaseModel").SQLDocument>;
    static hardDeleteImage(imageId: string): Promise<IImage & import("../../../sql/common/BaseModel").SQLDocument>;
    static updateImage(imageId: string, imageData: any): Promise<IImage & import("../../../sql/common/BaseModel").SQLDocument>;
    static createImageWithCleanup(uploadedFile: any, additionalData?: any, uploadedBy?: string): Promise<IImage | null>;
    static createMultipleImagesWithCleanup(uploadedFiles: any[], additionalData?: any, uploadedBy?: string): Promise<IImage[]>;
}
