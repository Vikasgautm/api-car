export const ROLES_KEY = 'roles';

// Simple role marker for middleware
export const Roles = (...roles: string[]) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    (descriptor.value as any).requiredRoles = roles;
    return descriptor;
  };
};
