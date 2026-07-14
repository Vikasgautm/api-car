export type SettingsGroup = 'general' | 'seo' | 'imports' | 'ai_intelligence' | 'lifecycle_publishing' | 'media' | 'performance' | 'security' | 'feature_flags' | 'audit_logs';
export declare const SETTINGS_GROUPS: SettingsGroup[];
export interface IPlatformSettings {
    group: SettingsGroup;
    data: Record<string, any>;
    updated_by?: string;
    updated_at: Date;
}
import { BaseModel } from '../sql/common/BaseModel';
export declare const PlatformSettings: BaseModel<IPlatformSettings>;
