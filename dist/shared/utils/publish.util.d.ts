import { BaseModel } from '../../sql/common/BaseModel';
export declare class PublishUtil {
    static publish<T extends {
        [key: string]: any;
    }>(model: BaseModel<T>, id: string, publishedBy?: string): Promise<any | null>;
    static unpublish<T extends {
        [key: string]: any;
    }>(model: BaseModel<T>, id: string, unpublishedBy?: string): Promise<any | null>;
    static togglePublish<T extends {
        [key: string]: any;
    }>(model: BaseModel<T>, id: string, userId?: string): Promise<any | null>;
    static publishMany<T extends {
        [key: string]: any;
    }>(model: BaseModel<T>, filter: any, publishedBy?: string): Promise<{
        modifiedCount: number;
    }>;
    static unpublishMany<T extends {
        [key: string]: any;
    }>(model: BaseModel<T>, filter: any, unpublishedBy?: string): Promise<{
        modifiedCount: number;
    }>;
    static isPublished(document: any | null): boolean;
    static addPublishedFilter<T extends Record<string, unknown>>(filter: T, field?: string, published?: boolean): T & Record<string, boolean>;
    static addUnpublishedFilter<T extends Record<string, unknown>>(filter: T, field?: string): T & Record<string, boolean>;
    static removePublishFilter<T extends Record<string, unknown>>(filter: T, field?: string): T;
    static getPublishStatus(document: any | null): {
        isPublished: boolean;
        publishedAt?: Date;
        publishedBy?: string;
        unpublishedAt?: Date;
        unpublishedBy?: string;
    };
}
