import { UpdateSEOSettingsDto } from '../dto/update-seo-settings.dto';
export declare class SettingsService {
    static getSEOSettings(): Promise<import("mongoose").Document<unknown, {}, import("../../../models/seo-settings.model").ISEOSettings, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/seo-settings.model").ISEOSettings & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateSEOSettings(updateDto: UpdateSEOSettingsDto): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/seo-settings.model").ISEOSettings, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/seo-settings.model").ISEOSettings & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
}
//# sourceMappingURL=settings.service.d.ts.map