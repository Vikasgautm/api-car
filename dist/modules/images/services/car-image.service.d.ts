import { ICarImage } from "../../../models/car-image.model";
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
    static getPublicGallery(filterDto: any): Promise<{
        images: (ICarImage & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getCarGallery(carId: string): Promise<{
        images: (import("mongoose").Document<unknown, {}, ICarImage, {}, import("mongoose").DefaultSchemaOptions> & ICarImage & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        grouped: Record<string, any>;
    }>;
    static createCarImage(imageData: any, uploadedBy?: string): Promise<import("mongoose").Document<unknown, {}, ICarImage, {}, import("mongoose").DefaultSchemaOptions> & ICarImage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateCarImage(imageId: string, imageData: any): Promise<import("mongoose").Document<unknown, {}, ICarImage, {}, import("mongoose").DefaultSchemaOptions> & ICarImage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
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
    private static extractPublicId;
}
//# sourceMappingURL=car-image.service.d.ts.map