"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyDeletionRequestDto = void 0;
class VerifyDeletionRequestDto {
    otp;
    static validate(dto) {
        const errors = [];
        if (!dto.otp || typeof dto.otp !== 'string') {
            errors.push('otp is required');
        }
        else if (!/^\d{4,8}$/.test(dto.otp.trim())) {
            errors.push('otp must be 4-8 digits');
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.VerifyDeletionRequestDto = VerifyDeletionRequestDto;
//# sourceMappingURL=verify-deletion-request.dto.js.map