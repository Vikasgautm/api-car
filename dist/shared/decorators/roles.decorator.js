"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Roles = exports.ROLES_KEY = void 0;
exports.ROLES_KEY = 'roles';
// Simple role marker for middleware
const Roles = (...roles) => {
    return (target, propertyKey, descriptor) => {
        descriptor.value.requiredRoles = roles;
        return descriptor;
    };
};
exports.Roles = Roles;
//# sourceMappingURL=roles.decorator.js.map