import { SettingsGroup } from '../../../models/platform-settings.model';
interface ValidationResult {
    valid: boolean;
    errors: string[];
}
export declare function validateSettingsData(group: SettingsGroup, data: any): ValidationResult;
export {};
//# sourceMappingURL=settings.validator.d.ts.map