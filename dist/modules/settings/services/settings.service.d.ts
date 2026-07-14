import { UpdateSEOSettingsDto } from '../../../shared/validation';
export declare class SettingsService {
    static getSEOSettings(): Promise<(import("../../../models/seo-settings.model").ISEOSettings & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static updateSEOSettings(updateDto: UpdateSEOSettingsDto): Promise<(import("../../../models/seo-settings.model").ISEOSettings & import("../../../sql/common/BaseModel").SQLDocument) | null>;
}
