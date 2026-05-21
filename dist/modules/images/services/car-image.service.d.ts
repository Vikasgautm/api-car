import { ICarImage } from '../../../models/car-image.model';
import { ImageStatus, MainCategory, SubCategory } from '../../../shared/services/media/media-constants';
export declare class CarImageService {
    static getAllCarImages(filterDto: any, includeDeleted?: boolean): Promise<{
        images: (import("mongoose").Document<unknown, {}, ICarImage, {}, import("mongoose").DefaultSchemaOptions> & ICarImage & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getCarImageById(imageId: string): Promise<(import("mongoose").Document<unknown, {}, ICarImage, {}, import("mongoose").DefaultSchemaOptions> & ICarImage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static getImagesByCategory(carId: string, mainCategory: MainCategory, subCategory?: SubCategory): Promise<import("../../../shared/services/media").ImageRecord[]>;
    static getPrimaryWithFallback(carId: string): Promise<{
        image: ICarImage & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
        level: string;
        fallback?: undefined;
    } | {
        image: null;
        fallback: import("../../../shared/services/media").FallbackImageResult;
        level: "body_type" | "standard" | "brand" | "variant_showcase" | "placeholder";
    }>;
    static getPublicGallery(filterDto: any): Promise<{
        images: (ICarImage & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getCarGallery(carId: string): Promise<{
        images: (ICarImage & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        grouped: Record<string, any[]>;
    }>;
    static createCarImage(imageData: any, uploadedBy?: string): Promise<import("mongoose").Document<unknown, {}, ICarImage, {}, import("mongoose").DefaultSchemaOptions> & ICarImage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateCarImage(imageId: string, imageData: any): Promise<(import("mongoose").Document<unknown, {}, ICarImage, {}, import("mongoose").DefaultSchemaOptions> & ICarImage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static bulkUpdateStatus(imageIds: string[], status: ImageStatus): Promise<import("mongoose").UpdateWriteOpResult>;
    static bulkAssignCategory(imageIds: string[], mainCategory: MainCategory, subCategory?: SubCategory): Promise<import("mongoose").UpdateWriteOpResult>;
    static bulkDelete(imageIds: string[]): Promise<import("mongoose").UpdateWriteOpResult>;
    static deleteCarImage(imageId: string): Promise<import("mongoose").Document<unknown, {}, ICarImage, {}, import("mongoose").DefaultSchemaOptions> & ICarImage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static restoreCarImage(imageId: string): Promise<import("mongoose").Document<unknown, {}, ICarImage, {}, import("mongoose").DefaultSchemaOptions> & ICarImage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static togglePublish(imageId: string): Promise<import("mongoose").Document<unknown, {}, ICarImage, {}, import("mongoose").DefaultSchemaOptions> & ICarImage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static setPrimaryImage(imageId: string): Promise<import("mongoose").Document<unknown, {}, ICarImage, {}, import("mongoose").DefaultSchemaOptions> & ICarImage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static findDuplicateByHash(carId: string, imageHash: string): Promise<(ICarImage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static resolveFallbackImage(carId: string): Promise<import("../../../shared/services/media").FallbackImageResult>;
}
//# sourceMappingURL=car-image.service.d.ts.map