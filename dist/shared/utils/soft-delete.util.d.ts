import { Document, Model } from 'mongoose';
export interface SoftDeleteDocument extends Document {
    is_deleted?: boolean;
    deleted_at?: Date;
    deleted_by?: string;
}
export declare class SoftDeleteUtil {
    static softDelete<T extends SoftDeleteDocument>(model: Model<T>, id: string, deletedBy?: string): Promise<T | null>;
    static restore<T extends SoftDeleteDocument>(model: Model<T>, id: string): Promise<T | null>;
    static permanentDelete<T extends SoftDeleteDocument>(model: Model<T>, id: string): Promise<T | null>;
    static restoreMany<T extends SoftDeleteDocument>(model: Model<T>, filter: any): Promise<{
        modifiedCount: number;
    }>;
    static softDeleteMany<T extends SoftDeleteDocument>(model: Model<T>, filter: any, deletedBy?: string): Promise<{
        modifiedCount: number;
    }>;
    static isDeleted(document: SoftDeleteDocument | null): boolean;
    static addDeletedFilter<T extends Record<string, unknown>>(filter: T, includeDeleted?: boolean): T & Record<string, boolean | undefined>;
    static addOnlyDeletedFilter<T extends Record<string, unknown>>(filter: T): T & Record<string, boolean>;
}
//# sourceMappingURL=soft-delete.util.d.ts.map