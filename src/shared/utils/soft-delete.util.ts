import { BaseModel } from '../../sql/common/BaseModel';

export class SoftDeleteUtil {
  static async softDelete<T extends { [key: string]: any }>(
    model: BaseModel<T>,
    id: string,
    deletedBy?: string
  ): Promise<any | null> {
    const updateData: any = {
      is_deleted: true,
      deleted_at: new Date(),
    };

    if (deletedBy) {
      updateData.deleted_by = deletedBy;
    }

    const pk = (model as any).primaryKey || 'id';
    await model.updateDirect({ [pk]: id }, updateData);
    return await model.findOne({ [pk]: id });
  }

  static async restore<T extends { [key: string]: any }>(
    model: BaseModel<T>,
    id: string
  ): Promise<any | null> {
    const pk = (model as any).primaryKey || 'id';
    await model.updateDirect(
      { [pk]: id },
      {
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
      }
    );
    return await model.findOne({ [pk]: id });
  }

  static async permanentDelete<T extends { [key: string]: any }>(
    model: BaseModel<T>,
    id: string
  ): Promise<any | null> {
    const pk = (model as any).primaryKey || 'id';
    const document = await model.findOne({ [pk]: id });
    if (!document) return null;
    await model.deleteDirect({ [pk]: id });
    return document;
  }

  static async restoreMany<T extends { [key: string]: any }>(
    model: BaseModel<T>,
    filter: any
  ): Promise<{ modifiedCount: number }> {
    const pk = (model as any).primaryKey || 'id';
    const count = await model.updateDirect(
      { ...filter, is_deleted: true },
      {
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
      }
    );
    return { modifiedCount: count };
  }

  static async softDeleteMany<T extends { [key: string]: any }>(
    model: BaseModel<T>,
    filter: any,
    deletedBy?: string
  ): Promise<{ modifiedCount: number }> {
    const updateData: any = {
      is_deleted: true,
      deleted_at: new Date(),
    };

    if (deletedBy) {
      updateData.deleted_by = deletedBy;
    }

    const pk = (model as any).primaryKey || 'id';
    const count = await model.updateDirect(
      { ...filter, is_deleted: false },
      updateData
    );
    return { modifiedCount: count };
  }

  static isDeleted(document: any | null): boolean {
    return document?.is_deleted === true;
  }

  static addDeletedFilter<T extends Record<string, unknown>>(
    filter: T,
    includeDeleted: boolean = false
  ): T & Record<string, boolean | undefined> {
    if (includeDeleted) {
      return filter as T & Record<string, boolean | undefined>;
    }
    return { ...filter, is_deleted: false } as T & Record<string, boolean>;
  }

  static addOnlyDeletedFilter<T extends Record<string, unknown>>(
    filter: T
  ): T & Record<string, boolean> {
    return { ...filter, is_deleted: true } as T & Record<string, boolean>;
  }
}
