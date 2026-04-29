"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationUtil = void 0;
const app_error_util_1 = require("./app-error.util");
class ValidationUtil {
    static required(value, fieldName) {
        if (value === undefined || value === null || value === '') {
            return {
                valid: false,
                errors: [`${fieldName} is required`],
            };
        }
        return { valid: true, errors: [] };
    }
    static email(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return {
                valid: false,
                errors: ['Invalid email format'],
            };
        }
        return { valid: true, errors: [] };
    }
    static minLength(value, min, fieldName) {
        if (value.length < min) {
            return {
                valid: false,
                errors: [`${fieldName} must be at least ${min} characters`],
            };
        }
        return { valid: true, errors: [] };
    }
    static maxLength(value, max, fieldName) {
        if (value.length > max) {
            return {
                valid: false,
                errors: [`${fieldName} must not exceed ${max} characters`],
            };
        }
        return { valid: true, errors: [] };
    }
    static min(value, min, fieldName) {
        if (value < min) {
            return {
                valid: false,
                errors: [`${fieldName} must be at least ${min}`],
            };
        }
        return { valid: true, errors: [] };
    }
    static max(value, max, fieldName) {
        if (value > max) {
            return {
                valid: false,
                errors: [`${fieldName} must not exceed ${max}`],
            };
        }
        return { valid: true, errors: [] };
    }
    static enum(value, allowedValues, fieldName) {
        if (!allowedValues.includes(value)) {
            return {
                valid: false,
                errors: [`${fieldName} must be one of: ${allowedValues.join(', ')}`],
            };
        }
        return { valid: true, errors: [] };
    }
    static url(value) {
        try {
            new URL(value);
            return { valid: true, errors: [] };
        }
        catch {
            return {
                valid: false,
                errors: ['Invalid URL format'],
            };
        }
    }
    static objectId(value) {
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(value)) {
            return {
                valid: false,
                errors: ['Invalid ObjectId format'],
            };
        }
        return { valid: true, errors: [] };
    }
    static slug(value) {
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slugRegex.test(value)) {
            return {
                valid: false,
                errors: ['Slug must contain only lowercase letters, numbers, and hyphens'],
            };
        }
        return { valid: true, errors: [] };
    }
    static pincode(value) {
        const pincodeRegex = /^[0-9]{6}$/;
        if (!pincodeRegex.test(value)) {
            return {
                valid: false,
                errors: ['Pincode must be a 6-digit number'],
            };
        }
        return { valid: true, errors: [] };
    }
    static latitude(value) {
        if (value < -90 || value > 90) {
            return {
                valid: false,
                errors: ['Latitude must be between -90 and 90'],
            };
        }
        return { valid: true, errors: [] };
    }
    static longitude(value) {
        if (value < -180 || value > 180) {
            return {
                valid: false,
                errors: ['Longitude must be between -180 and 180'],
            };
        }
        return { valid: true, errors: [] };
    }
    static combineResults(...results) {
        const allErrors = results.flatMap((r) => r.errors);
        return {
            valid: allErrors.length === 0,
            errors: allErrors,
        };
    }
    static throwIfInvalid(result) {
        if (!result.valid) {
            throw new app_error_util_1.AppError(result.errors.join(', '), 400);
        }
    }
}
exports.ValidationUtil = ValidationUtil;
//# sourceMappingURL=validation.util.js.map