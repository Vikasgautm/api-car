"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionService = exports.ALL_PERMISSIONS = exports.ROLE_DEFAULT_PERMISSIONS = exports.DOMAIN_DEFAULT_PERMISSIONS = exports.GOVERNANCE_ROLES = void 0;
const user_model_1 = require("../../../models/user.model");
exports.GOVERNANCE_ROLES = {
    SUPER_ADMIN: 'super_admin',
    OPERATIONS_ADMIN: 'operations_admin',
    CONTENT_EDITOR: 'content_editor',
    REVIEWER: 'reviewer',
    PUBLISHER: 'publisher',
    SEO_MANAGER: 'seo_manager',
    IMPORT_OPERATOR: 'import_operator',
    MEDIA_MANAGER: 'media_manager',
};
exports.DOMAIN_DEFAULT_PERMISSIONS = {
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
exports.ROLE_DEFAULT_PERMISSIONS = {
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
exports.ALL_PERMISSIONS = [
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
class PermissionService {
    static async getUserPermissions(userId) {
        const user = await user_model_1.User.findOne({ user_id: userId, is_deleted: false });
        if (!user)
            return [];
        if (user.role === 'super_admin')
            return ['*'];
        const permissions = new Set(user.permissions || []);
        // Merge domain-derived permissions
        for (const domain of (user.assigned_domains || [])) {
            const domainPerms = exports.DOMAIN_DEFAULT_PERMISSIONS[domain] || [];
            domainPerms.forEach((p) => permissions.add(p));
        }
        // Merge governance role default permissions
        const govRole = user.governance_role;
        if (govRole && exports.ROLE_DEFAULT_PERMISSIONS[govRole]) {
            exports.ROLE_DEFAULT_PERMISSIONS[govRole].forEach((p) => permissions.add(p));
        }
        return Array.from(permissions);
    }
    static async checkPermission(userId, permission) {
        const perms = await this.getUserPermissions(userId);
        return perms.includes('*') || perms.includes(permission);
    }
    static async hasOwnership(userId, brandId) {
        const user = await user_model_1.User.findOne({ user_id: userId, is_deleted: false });
        if (!user)
            return false;
        if (user.role === 'super_admin' || user.role === 'admin')
            return true;
        return (user.assigned_brands || []).includes(brandId);
    }
    static async hasDomain(userId, domain) {
        const user = await user_model_1.User.findOne({ user_id: userId, is_deleted: false });
        if (!user)
            return false;
        if (user.role === 'super_admin' || user.role === 'admin')
            return true;
        return (user.assigned_domains || []).includes(domain);
    }
    static async canWorkflow(userId, action) {
        const user = await user_model_1.User.findOne({ user_id: userId, is_deleted: false });
        if (!user)
            return false;
        if (user.role === 'super_admin')
            return true;
        const rights = user.workflow_rights || { can_review: false, can_publish: false, can_bulk_publish: false };
        if (action === 'review')
            return rights.can_review;
        if (action === 'publish')
            return rights.can_publish;
        if (action === 'bulk_publish')
            return rights.can_bulk_publish;
        return false;
    }
    static getDefaultPermissionsForRole(role) {
        return exports.ROLE_DEFAULT_PERMISSIONS[role] || [];
    }
}
exports.PermissionService = PermissionService;
//# sourceMappingURL=permission.service.js.map