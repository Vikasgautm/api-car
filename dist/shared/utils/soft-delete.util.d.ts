import { BaseModel } from '../../sql/common/BaseModel';
export declare class SoftDeleteUtil {
    static softDelete<T extends {
        [key: string]: any;
    }>(model: BaseModel<T>, id: string, deletedBy?: string): Promise<any | null>;
    static restore<T extends {
        [key: string]: any;
    }>(model: BaseModel<T>, id: string): Promise<any | null>;
    static permanentDelete<T extends {
        [key: string]: any;
    }>(model: BaseModel<T>, id: string): Promise<any | null>;
    static restoreMany<T extends {
        [key: string]: any;
    }>(model: BaseModel<T>, filter: any): Promise<{
        modifiedCount: number;
    }>;
    static softDeleteMany<T extends {
        [key: string]: any;
    }>(model: BaseModel<T>, filter: any, deletedBy?: string): Promise<{
        modifiedCount: number;
    }>;
    static isDeleted(document: any | null): boolean;
    static addDeletedFilter<T extends Record<string, unknown>>(filter: T, includeDeleted?: boolean): T & Record<string, boolean | undefined>;
    static addOnlyDeletedFilter<T extends Record<string, unknown>>(filter: T): T & Record<string, boolean>;
}
