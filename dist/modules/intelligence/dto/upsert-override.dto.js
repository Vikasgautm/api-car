"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsertBenchmarkOverrideDto = void 0;
const validation_util_1 = require("../../../shared/utils/validation.util");
class UpsertBenchmarkOverrideDto {
    weak_max;
    average_max;
    good_max;
    static validate(dto) {
        const errors = [];
        const fields = [['weak_max'], ['average_max'], ['good_max']];
        for (const [field] of fields) {
            const value = dto[field];
            if (value === undefined || value === null) {
                errors.push(`${field} is required`);
                continue;
            }
            if (typeof value !== 'number' || !Number.isFinite(value)) {
                errors.push(`${field} must be a finite number`);
                continue;
            }
            const minResult = validation_util_1.ValidationUtil.min(value, 0, field);
            if (!minResult.valid)
                errors.push(...minResult.errors);
        }
        if (errors.length === 0) {
            if (!(dto.weak_max < dto.average_max && dto.average_max < dto.good_max)) {
                errors.push('Thresholds must be strictly increasing: weak_max < average_max < good_max');
            }
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.UpsertBenchmarkOverrideDto = UpsertBenchmarkOverrideDto;
//# sourceMappingURL=upsert-override.dto.js.map