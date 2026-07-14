import bcrypt from 'bcrypt';

export enum UserRole {
  USER = 'user',
  EDITOR = 'editor',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum GovernanceRole {
  SUPER_ADMIN = 'super_admin',
  OPERATIONS_ADMIN = 'operations_admin',
  CONTENT_EDITOR = 'content_editor',
  REVIEWER = 'reviewer',
  PUBLISHER = 'publisher',
  SEO_MANAGER = 'seo_manager',
  IMPORT_OPERATOR = 'import_operator',
  MEDIA_MANAGER = 'media_manager',
}

export type GovernanceDomain = 'variants' | 'seo' | 'imports' | 'comparisons' | 'media' | 'blogs' | 'faqs' | 'taxonomy' | 'lifecycle';

export interface IWorkflowRights {
  can_review: boolean;
  can_publish: boolean;
  can_bulk_publish: boolean;
}

export interface ISecuritySettings {
  max_sessions: number;
  force_password_reset: boolean;
  temp_access_expiry?: Date | null;
}

export interface IUser  {
  user_id: string;
  user_name: string;
  email: string;
  password?: string;
  phone?: string;
  whatsapp_phone?: string;
  whatsapp_opt_in?: boolean;
  profile_pic?: string;
  role: UserRole;
  // Governance fields
  governance_role?: GovernanceRole;
  permissions: string[];
  assigned_brands: string[];
  assigned_domains: GovernanceDomain[];
  workflow_rights: IWorkflowRights;
  security: ISecuritySettings;
  // Existing fields
  is_email_verified: boolean;
  google_id?: string;
  is_deleted: boolean;
  theme?: string;
  is_active?: boolean;
  last_login_at?: Date;
  password_reset_token?: string;
  password_reset_expires?: Date;
  comparePassword(password: string): Promise<boolean>;
}

import { BaseModel } from '../sql/common/BaseModel';
export const User = new BaseModel<IUser>('Users', 'user_id', ['permissions', 'assigned_brands', 'assigned_domains', 'workflow_rights', 'security']);
