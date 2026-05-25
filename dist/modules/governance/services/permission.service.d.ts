export declare const GOVERNANCE_ROLES: {
    readonly SUPER_ADMIN: "super_admin";
    readonly OPERATIONS_ADMIN: "operations_admin";
    readonly CONTENT_EDITOR: "content_editor";
    readonly REVIEWER: "reviewer";
    readonly PUBLISHER: "publisher";
    readonly SEO_MANAGER: "seo_manager";
    readonly IMPORT_OPERATOR: "import_operator";
    readonly MEDIA_MANAGER: "media_manager";
};
export type GovernanceRoleKey = (typeof GOVERNANCE_ROLES)[keyof typeof GOVERNANCE_ROLES];
export declare const DOMAIN_DEFAULT_PERMISSIONS: Record<string, string[]>;
export declare const ROLE_DEFAULT_PERMISSIONS: Record<GovernanceRoleKey, string[]>;
export declare const ALL_PERMISSIONS: string[];
export declare class PermissionService {
    static getUserPermissions(userId: string): Promise<string[]>;
    static checkPermission(userId: string, permission: string): Promise<boolean>;
    static hasOwnership(userId: string, brandId: string): Promise<boolean>;
    static hasDomain(userId: string, domain: string): Promise<boolean>;
    static canWorkflow(userId: string, action: 'review' | 'publish' | 'bulk_publish'): Promise<boolean>;
    static getDefaultPermissionsForRole(role: GovernanceRoleKey): string[];
}
//# sourceMappingURL=permission.service.d.ts.map