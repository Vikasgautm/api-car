"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenDto = void 0;
class RefreshTokenDto {
    refreshToken;
    static validate(dto) {
        const errors = [];
        if (!dto.refreshToken) {
            errors.push('Refresh token is required');
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.RefreshTokenDto = RefreshTokenDto;
//# sourceMappingURL=refresh-token.dto.js.map