"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterDto = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["ADMIN"] = "admin";
    UserRole["EDITOR"] = "editor";
    UserRole["USER"] = "user";
})(UserRole || (exports.UserRole = UserRole = {}));
class RegisterDto {
    user_name;
    email;
    password;
    phone;
    role = UserRole.USER;
    static validate(dto) {
        const errors = [];
        const validRoles = Object.values(UserRole);
        if (!dto.user_name || dto.user_name.length < 2) {
            errors.push('Name must be at least 2 characters');
        }
        if (!dto.email || !dto.email.includes('@')) {
            errors.push('Please provide a valid email');
        }
        if (!dto.password || dto.password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }
        if (dto.role && !validRoles.includes(dto.role)) {
            errors.push('Invalid role');
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.RegisterDto = RegisterDto;
//# sourceMappingURL=register.dto.js.map