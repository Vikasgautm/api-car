import { Types } from 'mongoose';
import { IVariantImportStaging, ImportStatus } from '../models/VariantImportStaging';
interface StagingInput {
    source_car_name: string;
    variant_name: string;
    price?: string | number;
    fuel_type?: string;
    transmission?: string;
    raw_specs?: Record<string, any>;
}
interface CreateSessionInput {
    session_name: string;
    source_name?: string;
    imported_by?: string;
    variants: StagingInput[];
}
export declare class VariantIngestionService {
    static createSession(input: CreateSessionInput): Promise<{
        session: import("mongoose").Document<unknown, {}, import("../models/ImportSession").IImportSession, {}, import("mongoose").DefaultSchemaOptions> & import("../models/ImportSession").IImportSession & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        staged_count: number;
        groups: number;
    }>;
    static previewStaging(variants: StagingInput[]): Promise<{
        source_car_name: string;
        variant_name: string;
        price: number | undefined;
        fuel_type: string | undefined;
        transmission: string | undefined;
        normalized_specs: Record<string, any>;
        validation_results: import("../models/VariantImportStaging").ValidationIssue[];
        completeness_score: number;
        has_errors: boolean;
    }[]>;
    static getStagingList(filters?: Record<string, any>, page?: number, limit?: number): Promise<{
        docs: (import("mongoose").Document<unknown, {}, IVariantImportStaging, {}, import("mongoose").DefaultSchemaOptions> & IVariantImportStaging & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    static linkCar(stagingId: string, carId: string, linkedBy: string): Promise<{
        success: boolean;
    }>;
    static bulkLinkCar(stagingIds: string[], carId: string, linkedBy: string): Promise<{
        updated: number;
    }>;
    static bulkValidate(stagingIds: string[]): Promise<{
        id: string;
        status: "grouped" | "linked" | "validation_failed";
        issues: number;
    }[]>;
    static bulkUpdateStatus(stagingIds: string[], status: ImportStatus, userId: string): Promise<{
        updated: number;
    }>;
    static rejectVariant(stagingId: string, reason: string, userId: string): Promise<{
        success: boolean;
    }>;
    static getSessions(page?: number, limit?: number): Promise<{
        docs: (import("mongoose").Document<unknown, {}, import("../models/ImportSession").IImportSession, {}, import("mongoose").DefaultSchemaOptions> & import("../models/ImportSession").IImportSession & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    static getSession(sessionId: string): Promise<(import("mongoose").Document<unknown, {}, import("../models/ImportSession").IImportSession, {}, import("mongoose").DefaultSchemaOptions> & import("../models/ImportSession").IImportSession & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static checkDuplicates(variants: StagingInput[]): Promise<{
        source_car_name: string;
        variant_name: string;
        is_duplicate: boolean;
        existing_count: number;
        existing_statuses: ImportStatus[];
    }[]>;
}
export {};
//# sourceMappingURL=VariantIngestionService.d.ts.map