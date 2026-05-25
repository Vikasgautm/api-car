import { User } from '../../../models/user.model';

export const GOVERNANCE_ROLES = {
  SUPER_ADMIN: 'super_admin',
  OPERATIONS_ADMIN: 'operations_admin',
  CONTENT_EDITOR: 'content_editor',
  REVIEWER: 'reviewer',
  PUBLISHER: 'publisher',
  SEO_MANAGER: 'seo_manager',
  IMPORT_OPERATOR: 'import_operator',
  MEDIA_MANAGER: 'media_manager',
} as const;

export type GovernanceRoleKey = (typeof GOVERNANCE_ROLES)[keyof typeof GOVERNANCE_ROLES];

export const DOMAIN_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  variants: ['cars.read', 'variants.read', 'variants.create', 'variants.update', 'comparisons.read'],
  seo: ['seo.read', 'seo.create', 'seo.update', 'seo.publish', 'faqs.read', 'faqs.update'],
  imports: ['imports.execute', 'imports.read', 'variants.read'],
  comparisons: ['comparisons.read', 'comparisons.create', 'comparisons.update'],
  media: ['media.read', 'media.upload', 'media.update', 'media.delete'],
  blogs: ['blogs.read', 'blogs.create', 'blogs.update', 'blogs.publish'],
  faqs: ['faqs.read', 'faqs.create', 'faqs.update', 'faqs.publish'],
  taxonomy: ['taxonomy.read', 'taxonomy.update'],
  lifecycle: ['cars.read', 'lifecycle.read', 'lifecycle.update'],
};

export const ROLE_DEFAULT_PERMISSIONS: Record<GovernanceRoleKey, string[]> = {
  super_admin: ['*'],
  operations_admin: [
    'cars.read', 'cars.create', 'cars.update', 'cars.delete',
    'variants.read', 'variants.create', 'variants.update',
    'imports.execute', 'imports.read',
    'redirects.manage', 'lifecycle.manage',
    'users.read',
  ],
  content_editor: [
    'cars.read', 'variants.read', 'variants.create', 'variants.update',
    'blogs.read', 'blogs.create', 'blogs.update',
    'faqs.read', 'faqs.create', 'faqs.update',
    'media.read', 'media.upload',
  ],
  reviewer: [
    'cars.read', 'variants.read', 'blogs.read', 'faqs.read', 'seo.read',
    'workflow.review', 'workflow.approve', 'workflow.reject',
  ],
  publisher: [
    'cars.read', 'variants.read', 'blogs.read', 'faqs.read', 'seo.read',
    'workflow.publish', 'redirects.manage',
  ],
  seo_manager: [
    'seo.read', 'seo.create', 'seo.update', 'seo.publish',
    'faqs.read', 'faqs.create', 'faqs.update', 'faqs.publish',
    'blogs.read', 'blogs.create', 'blogs.update', 'blogs.publish',
  ],
  import_operator: [
    'imports.execute', 'imports.read',
    'variants.read', 'variants.create', 'variants.update',
  ],
  media_manager: [
    'media.read', 'media.upload', 'media.update', 'media.delete',
    'cars.read', 'variants.read',
  ],
};

export const ALL_PERMISSIONS = [
  'cars.read', 'cars.create', 'cars.update', 'cars.delete',
  'variants.read', 'variants.create', 'variants.update', 'variants.delete',
  'seo.read', 'seo.create', 'seo.update', 'seo.publish',
  'imports.read', 'imports.execute',
  'comparisons.read', 'comparisons.create', 'comparisons.update',
  'media.read', 'media.upload', 'media.update', 'media.delete',
  'blogs.read', 'blogs.create', 'blogs.update', 'blogs.publish',
  'faqs.read', 'faqs.create', 'faqs.update', 'faqs.publish',
  'taxonomy.read', 'taxonomy.update',
  'lifecycle.read', 'lifecycle.update', 'lifecycle.manage',
  'redirects.manage',
  'workflow.review', 'workflow.approve', 'workflow.reject', 'workflow.publish',
  'users.read', 'users.manage',
  'settings.read', 'settings.manage',
];

export class PermissionService {
  static async getUserPermissions(userId: string): Promise<string[]> {
    const user = await User.findOne({ user_id: userId, is_deleted: false });
    if (!user) return [];

    if (user.role === 'super_admin') return ['*'];

    const permissions = new Set<string>(user.permissions || []);

    // Merge domain-derived permissions
    for (const domain of (user.assigned_domains || [])) {
      const domainPerms = DOMAIN_DEFAULT_PERMISSIONS[domain] || [];
      domainPerms.forEach((p) => permissions.add(p));
    }

    // Merge governance role default permissions
    const govRole = user.governance_role as GovernanceRoleKey | undefined;
    if (govRole && ROLE_DEFAULT_PERMISSIONS[govRole]) {
      ROLE_DEFAULT_PERMISSIONS[govRole].forEach((p) => permissions.add(p));
    }

    return Array.from(permissions);
  }

  static async checkPermission(userId: string, permission: string): Promise<boolean> {
    const perms = await this.getUserPermissions(userId);
    return perms.includes('*') || perms.includes(permission);
  }

  static async hasOwnership(userId: string, brandId: string): Promise<boolean> {
    const user = await User.findOne({ user_id: userId, is_deleted: false });
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'admin') return true;
    return (user.assigned_brands || []).includes(brandId);
  }

  static async hasDomain(userId: string, domain: string): Promise<boolean> {
    const user = await User.findOne({ user_id: userId, is_deleted: false });
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'admin') return true;
    return (user.assigned_domains as string[] || []).includes(domain);
  }

  static async canWorkflow(userId: string, action: 'review' | 'publish' | 'bulk_publish'): Promise<boolean> {
    const user = await User.findOne({ user_id: userId, is_deleted: false });
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    const rights = user.workflow_rights || { can_review: false, can_publish: false, can_bulk_publish: false };
    if (action === 'review') return rights.can_review;
    if (action === 'publish') return rights.can_publish;
    if (action === 'bulk_publish') return rights.can_bulk_publish;
    return false;
  }

  static getDefaultPermissionsForRole(role: GovernanceRoleKey): string[] {
    return ROLE_DEFAULT_PERMISSIONS[role] || [];
  }
}
