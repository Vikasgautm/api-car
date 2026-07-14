export type SettingsGroup =
  | 'general'
  | 'seo'
  | 'imports'
  | 'ai_intelligence'
  | 'lifecycle_publishing'
  | 'media'
  | 'performance'
  | 'security'
  | 'feature_flags'
  | 'audit_logs';

export const SETTINGS_GROUPS: SettingsGroup[] = [
  'general',
  'seo',
  'imports',
  'ai_intelligence',
  'lifecycle_publishing',
  'media',
  'performance',
  'security',
  'feature_flags',
  'audit_logs',
];

export interface IPlatformSettings  {
  group: SettingsGroup;
  data: Record<string, any>;
  updated_by?: string;
  updated_at: Date;
}

import { BaseModel } from '../sql/common/BaseModel';
export const PlatformSettings = new BaseModel<IPlatformSettings>('PlatformSettings', 'settings_id', ['settings_data']);
