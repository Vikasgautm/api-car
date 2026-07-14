import { BaseModel } from '../../sql/common/BaseModel';

export class PublishUtil {
  static async publish<T extends { [key: string]: any }>(
    model: BaseModel<T>,
    id: string,
    publishedBy?: string
  ): Promise<any | null> {
    const updateData: any = {
      is_published: true,
      published_at: new Date(),
      unpublished_at: null,
      unpublished_by: null,
    };

    if (publishedBy) {
      updateData.published_by = publishedBy;
    }

    const pk = (model as any).primaryKey || 'id';
    await model.updateDirect({ [pk]: id }, updateData);
    return await model.findOne({ [pk]: id });
  }

  static async unpublish<T extends { [key: string]: any }>(
    model: BaseModel<T>,
    id: string,
    unpublishedBy?: string
  ): Promise<any | null> {
    const updateData: any = {
      is_published: false,
      unpublished_at: new Date(),
    };

    if (unpublishedBy) {
      updateData.unpublished_by = unpublishedBy;
    }

    const pk = (model as any).primaryKey || 'id';
    await model.updateDirect({ [pk]: id }, updateData);
    return await model.findOne({ [pk]: id });
  }

  static async togglePublish<T extends { [key: string]: any }>(
    model: BaseModel<T>,
    id: string,
    userId?: string
  ): Promise<any | null> {
    const pk = (model as any).primaryKey || 'id';
    const document = await model.findOne({ [pk]: id });
    
    if (!document) {
      return null;
    }

    if (document.is_published) {
      return await this.unpublish(model, id, userId);
    } else {
      return await this.publish(model, id, userId);
    }
  }

  static async publishMany<T extends { [key: string]: any }>(
    model: BaseModel<T>,
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

    const pk = (model as any).primaryKey || 'id';
    const count = await model.updateDirect({ ...filter, is_published: false }, updateData);
    return { modifiedCount: count };
  }

  static async unpublishMany<T extends { [key: string]: any }>(
    model: BaseModel<T>,
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

    const pk = (model as any).primaryKey || 'id';
    const count = await model.updateDirect({ ...filter, is_published: true }, updateData);
    return { modifiedCount: count };
  }

  static isPublished(document: any | null): boolean {
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

  static getPublishStatus(document: any | null): {
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
