import { Document } from 'mongoose';
export type SettingsGroup = 'general' | 'seo' | 'imports' | 'ai_intelligence' | 'lifecycle_publishing' | 'media' | 'performance' | 'security' | 'feature_flags' | 'audit_logs';
export declare const SETTINGS_GROUPS: SettingsGroup[];
export interface IPlatformSettings extends Document {
    group: SettingsGroup;
    data: Record<string, any>;
    updated_by?: string;
    updated_at: Date;
}
export declare const PlatformSettings: import("mongoose").Model<IPlatformSettings, {}, {}, {}, Document<unknown, {}, IPlatformSettings, {}, import("mongoose").DefaultSchemaOptions> & IPlatformSettings & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPlatformSettings>;
//# sourceMappingURL=platform-settings.model.d.ts.map