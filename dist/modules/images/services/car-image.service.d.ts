import { ICarImage } from '../../../models/car-image.model';
import { ImageStatus, MainCategory, SubCategory } from '../../../shared/services/media/media-constants';
export declare class CarImageService {
    static getAllCarImages(filterDto: any, includeDeleted?: boolean): Promise<{
        images: (ICarImage & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getCarImageById(imageId: string): Promise<(ICarImage & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static getImagesByCategory(carId: string, mainCategory: MainCategory, subCategory?: SubCategory): Promise<import("../../../shared/services/media").ImageRecord[]>;
    static getPrimaryWithFallback(carId: string): Promise<{
        image: ICarImage & import("../../../sql/common/BaseModel").SQLDocument;
        level: string;
        fallback?: undefined;
    } | {
        image: null;
        fallback: import("../../../shared/services/media").FallbackImageResult;
        level: "brand" | "body_type" | "standard" | "variant_showcase" | "placeholder";
    }>;
    static getPublicGallery(filterDto: any): Promise<{
        images: (ICarImage & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getCarGallery(carId: string): Promise<{
        images: (ICarImage & import("../../../sql/common/BaseModel").SQLDocument)[];
        grouped: Record<string, any[]>;
    }>;
    static createCarImage(imageData: any, uploadedBy?: string): Promise<any>;
    static updateCarImage(imageId: string, imageData: any): Promise<(ICarImage & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static bulkUpdateStatus(imageIds: string[], status: ImageStatus): Promise<{
        modifiedCount: number;
    }>;
    static bulkAssignCategory(imageIds: string[], mainCategory: MainCategory, subCategory?: SubCategory): Promise<{
        modifiedCount: number;
    }>;
    static bulkDelete(imageIds: string[]): Promise<{
        modifiedCount: number;
    }>;
    static deleteCarImage(imageId: string): Promise<ICarImage & import("../../../sql/common/BaseModel").SQLDocument>;
    static restoreCarImage(imageId: string): Promise<ICarImage & import("../../../sql/common/BaseModel").SQLDocument>;
    static togglePublish(imageId: string): Promise<ICarImage & import("../../../sql/common/BaseModel").SQLDocument>;
    static setPrimaryImage(imageId: string): Promise<ICarImage & import("../../../sql/common/BaseModel").SQLDocument>;
    static findDuplicateByHash(carId: string, imageHash: string): Promise<(ICarImage & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static resolveFallbackImage(carId: string): Promise<import("../../../shared/services/media").FallbackImageResult>;
}
