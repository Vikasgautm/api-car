import { SettingsGroup } from '../../../models/platform-settings.model';
export declare class PlatformSettingsService {
    static ensureDefaults(): Promise<void>;
    static getAllSettings(): Promise<Record<SettingsGroup, Record<string, any>>>;
    static getSettingsByGroup(group: SettingsGroup): Promise<Record<string, any>>;
    static updateSettingsByGroup(group: SettingsGroup, updates: Record<string, any>, actorId: string, actorName?: string): Promise<Record<string, any>>;
    static resetGroupToDefault(group: SettingsGroup, actorId: string, actorName?: string): Promise<Record<string, any>>;
    static exportSettings(): Promise<Record<string, any>>;
    static importSettings(payload: {
        settings: Record<string, any>;
    }, actorId: string, actorName?: string): Promise<{
        imported: string[];
        errors: string[];
    }>;
    static getHistory(group?: string, limit?: number, skip?: number): Promise<{
        items: any[];
        total: number;
    }>;
    static isSuperAdminOnly(group: SettingsGroup): boolean;
    static invalidateCache(group?: SettingsGroup): void;
    static getSystemStatus(): Promise<Record<string, any>>;
}
//# sourceMappingURL=platform-settings.service.d.ts.map