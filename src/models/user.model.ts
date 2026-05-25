import bcrypt from 'bcrypt';
import { Document, Schema, model } from 'mongoose';

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

export interface IUser extends Document {
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

const userSchema = new Schema<IUser>(
  {
    user_id: { type: String, required: true, unique: true },
    user_name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    whatsapp_phone: {
      type: String,
      trim: true,
    },
    whatsapp_opt_in: { type: Boolean, default: false },
    profile_pic: { type: String },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      required: true,
    },
    governance_role: {
      type: String,
      enum: Object.values(GovernanceRole),
    },
    permissions: { type: [String], default: [] },
    assigned_brands: { type: [String], default: [] },
    assigned_domains: { type: [String], default: [] },
    workflow_rights: {
      type: {
        can_review: { type: Boolean, default: false },
        can_publish: { type: Boolean, default: false },
        can_bulk_publish: { type: Boolean, default: false },
      },
      default: () => ({ can_review: false, can_publish: false, can_bulk_publish: false }),
    },
    security: {
      type: {
        max_sessions: { type: Number, default: 3 },
        force_password_reset: { type: Boolean, default: false },
        temp_access_expiry: { type: Date, default: null },
      },
      default: () => ({ max_sessions: 3, force_password_reset: false, temp_access_expiry: null }),
    },
    is_email_verified: { type: Boolean, default: false },
    google_id: { type: String },
    is_deleted: { type: Boolean, default: false, select: false },
    theme: { type: String, default: "light" },
    is_active: { type: Boolean, default: true },
    last_login_at: { type: Date },
    password_reset_token: { type: String, select: false },
    password_reset_expires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  const user = this as IUser;
  if (!user.isModified('password')) return;
  user.password = await bcrypt.hash(user.password!, 12);
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

userSchema.index({ google_id: 1 });
userSchema.index({ is_deleted: 1 });
userSchema.index({ is_email_verified: 1 });
userSchema.index({ role: 1 });

export const User = model<IUser>('User', userSchema);
