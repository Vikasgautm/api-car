import { Document, Model } from 'mongoose';

export interface PublishDocument extends Document {
  is_published?: boolean;
  published_at?: Date;
  published_by?: string;
  unpublished_at?: Date;
  unpublished_by?: string;
}

export class PublishUtil {
  static async publish<T extends PublishDocument>(
    model: Model<T>,
    id: string,
    publishedBy?: string
  ): Promise<T | null> {
    const updateData: any = {
      is_published: true,
      published_at: new Date(),
      unpublished_at: null,
      unpublished_by: null,
    };

    if (publishedBy) {
      updateData.published_by = publishedBy;
    }

    return await model.findByIdAndUpdate(
      id,
      updateData,
      { returnDocument: 'after', runValidators: true }
    );
  }

  static async unpublish<T extends PublishDocument>(
    model: Model<T>,
    id: string,
    unpublishedBy?: string
  ): Promise<T | null> {
    const updateData: any = {
      is_published: false,
      unpublished_at: new Date(),
    };

    if (unpublishedBy) {
      updateData.unpublished_by = unpublishedBy;
    }

    return await model.findByIdAndUpdate(
      id,
      updateData,
      { returnDocument: 'after', runValidators: true }
    );
  }

  static async togglePublish<T extends PublishDocument>(
    model: Model<T>,
    id: string,
    userId?: string
  ): Promise<T | null> {
    const document = await model.findById(id);
    
    if (!document) {
      return null;
    }

    if (document.is_published) {
      return (await this.unpublish(model, id, userId)) as T | null;
    } else {
      return (await this.publish(model, id, userId)) as T | null;
    }
  }

  static async publishMany<T extends PublishDocument>(
    model: Model<T>,
    filter: any,
    publishedBy?: string
  ): Promise<{ modifiedCount: number }> {
    const updateData: any = {
      is_published: true,
      published_at: new Date(),
      unpublished_at: null,
      unpublished_by: null,
    };

    if (publishedBy) {
      updateData.published_by = publishedBy;
    }

    const result = await model.updateMany(
      { ...filter, is_published: false },
      updateData
    );
    return { modifiedCount: result.modifiedCount || 0 };
  }

  static async unpublishMany<T extends PublishDocument>(
    model: Model<T>,
    filter: any,
    unpublishedBy?: string
  ): Promise<{ modifiedCount: number }> {
    const updateData: any = {
      is_published: false,
      unpublished_at: new Date(),
    };

    if (unpublishedBy) {
      updateData.unpublished_by = unpublishedBy;
    }

    const result = await model.updateMany(
      { ...filter, is_published: true },
      updateData
    );
    return { modifiedCount: result.modifiedCount || 0 };
  }

  static isPublished(document: PublishDocument | null): boolean {
    return document?.is_published === true;
  }

  static addPublishedFilter<T extends Record<string, unknown>>(
    filter: T,
    field: string = 'is_published',
    published: boolean = true
  ): T & Record<string, boolean> {
    return { ...filter, [field]: published } as T & Record<string, boolean>;
  }

  static addUnpublishedFilter<T extends Record<string, unknown>>(
    filter: T,
    field: string = 'is_published'
  ): T & Record<string, boolean> {
    return { ...filter, [field]: false } as T & Record<string, boolean>;
  }

  static removePublishFilter<T extends Record<string, unknown>>(
    filter: T,
    field: string = 'is_published'
  ): T {
    const { [field]: removed, ...rest } = filter as any;
    return rest as T;
  }

  static getPublishStatus(document: PublishDocument | null): {
    isPublished: boolean;
    publishedAt?: Date;
    publishedBy?: string;
    unpublishedAt?: Date;
    unpublishedBy?: string;
  } {
    if (!document) {
      return {
        isPublished: false,
      };
    }

    return {
      isPublished: document.is_published === true,
      publishedAt: document.published_at,
      publishedBy: document.published_by,
      unpublishedAt: document.unpublished_at,
      unpublishedBy: document.unpublished_by,
    };
  }
}
