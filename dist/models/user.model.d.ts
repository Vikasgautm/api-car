import { Document } from 'mongoose';
export declare enum UserRole {
    USER = "user",
    EDITOR = "editor",
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin"
}
export declare enum GovernanceRole {
    SUPER_ADMIN = "super_admin",
    OPERATIONS_ADMIN = "operations_admin",
    CONTENT_EDITOR = "content_editor",
    REVIEWER = "reviewer",
    PUBLISHER = "publisher",
    SEO_MANAGER = "seo_manager",
    IMPORT_OPERATOR = "import_operator",
    MEDIA_MANAGER = "media_manager"
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
    governance_role?: GovernanceRole;
    permissions: string[];
    assigned_brands: string[];
    assigned_domains: GovernanceDomain[];
    workflow_rights: IWorkflowRights;
    security: ISecuritySettings;
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
export declare const User: import("mongoose").Model<IUser, {}, {}, {}, Document<unknown, {}, IUser, {}, import("mongoose").DefaultSchemaOptions> & IUser & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUser>;
//# sourceMappingURL=user.model.d.ts.map