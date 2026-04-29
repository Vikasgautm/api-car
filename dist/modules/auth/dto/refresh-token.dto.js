"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenDto = void 0;
class RefreshTokenDto {
    refresh_token;
    static validate(dto) {
        const errors = [];
        if (!dto.refresh_token) {
            errors.push('Refresh token is required');
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.RefreshTokenDto = RefreshTokenDto;
//# sourceMappingURL=refresh-token.dto.js.map