"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginDto = void 0;
class LoginDto {
    email;
    password;
    static validate(dto) {
        const errors = [];
        if (!dto.email || !dto.email.includes('@')) {
            errors.push('Please provide a valid email');
        }
        if (!dto.password || dto.password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.LoginDto = LoginDto;
//# sourceMappingURL=login.dto.js.map