import { Document, Model } from 'mongoose';
export interface PublishDocument extends Document {
    is_published?: boolean;
    published_at?: Date;
    published_by?: string;
    unpublished_at?: Date;
    unpublished_by?: string;
}
export declare class PublishUtil {
    static publish<T extends PublishDocument>(model: Model<T>, id: string, publishedBy?: string): Promise<T | null>;
    static unpublish<T extends PublishDocument>(model: Model<T>, id: string, unpublishedBy?: string): Promise<T | null>;
    static togglePublish<T extends PublishDocument>(model: Model<T>, id: string, userId?: string): Promise<T | null>;
    static publishMany<T extends PublishDocument>(model: Model<T>, filter: any, publishedBy?: string): Promise<{
        modifiedCount: number;
    }>;
    static unpublishMany<T extends PublishDocument>(model: Model<T>, filter: any, unpublishedBy?: string): Promise<{
        modifiedCount: number;
    }>;
    static isPublished(document: PublishDocument | null): boolean;
    static addPublishedFilter<T extends Record<string, unknown>>(filter: T, field?: string, published?: boolean): T & Record<string, boolean>;
    static addUnpublishedFilter<T extends Record<string, unknown>>(filter: T, field?: string): T & Record<string, boolean>;
    static removePublishFilter<T extends Record<string, unknown>>(filter: T, field?: string): T;
    static getPublishStatus(document: PublishDocument | null): {
        isPublished: boolean;
        publishedAt?: Date;
        publishedBy?: string;
        unpublishedAt?: Date;
        unpublishedBy?: string;
    };
}
//# sourceMappingURL=publish.util.d.ts.map