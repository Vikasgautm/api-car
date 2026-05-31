"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = require("crypto");
const app_error_util_1 = require("../utils/app-error.util");
class OtpService {
    /**
     * Generate a numeric OTP of `digits` digits (default 6). Uses `crypto.randomInt`
     * for uniform distribution — Math.random is not acceptable for security tokens.
     */
    static generate(digits = 6) {
        if (digits < 4 || digits > 8) {
            throw app_error_util_1.AppError.internal('OTP digits must be between 4 and 8');
        }
        const min = 10 ** (digits - 1);
        const max = 10 ** digits;
        return String((0, crypto_1.randomInt)(min, max));
    }
    static async hash(otp) {
        return bcrypt_1.default.hash(otp, 10);
    }
    static async verify(otp, hash) {
        if (!otp || !hash)
            return false;
        return bcrypt_1.default.compare(otp, hash);
    }
}
exports.OtpService = OtpService;
//# sourceMappingURL=otp.service.js.map