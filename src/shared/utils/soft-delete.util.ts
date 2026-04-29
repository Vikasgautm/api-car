import { Document, Model } from 'mongoose';

export interface SoftDeleteDocument extends Document {
  is_deleted?: boolean;
  deleted_at?: Date;
  deleted_by?: string;
}

export class SoftDeleteUtil {
  static async softDelete<T extends SoftDeleteDocument>(
    model: Model<T>,
    id: string,
    deletedBy?: string
  ): Promise<T | null> {
    const updateData: any = {
      is_deleted: true,
      deleted_at: new Date(),
    };

    if (deletedBy) {
      updateData.deleted_by = deletedBy;
    }

    return await model.findByIdAndUpdate(
      id,
      updateData,
      { returnDocument: 'after', runValidators: true }
    );
  }

  static async restore<T extends SoftDeleteDocument>(
    model: Model<T>,
    id: string
  ): Promise<T | null> {
    return await model.findByIdAndUpdate(
      id,
      {
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
      },
      { returnDocument: 'after', runValidators: true }
    );
  }

  static async permanentDelete<T extends SoftDeleteDocument>(
    model: Model<T>,
    id: string
  ): Promise<T | null> {
    return await model.findByIdAndDelete(id);
  }

  static async restoreMany<T extends SoftDeleteDocument>(
    model: Model<T>,
    filter: any
  ): Promise<{ modifiedCount: number }> {
    const result = await model.updateMany(
      { ...filter, is_deleted: true },
      {
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
      }
    );
    return { modifiedCount: result.modifiedCount || 0 };
  }

  static async softDeleteMany<T extends SoftDeleteDocument>(
    model: Model<T>,
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

    const result = await model.updateMany(
      { ...filter, is_deleted: false },
      updateData
    );
    return { modifiedCount: result.modifiedCount || 0 };
  }

  static isDeleted(document: SoftDeleteDocument | null): boolean {
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
