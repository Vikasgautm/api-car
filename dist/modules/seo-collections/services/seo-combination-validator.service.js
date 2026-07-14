"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoCombinationValidatorService = void 0;
const INVALID_COMBOS = [
    { fuel: 'cng', body: 'coupe', reason: 'CNG Coupe cars do not exist in the Indian market' },
    { fuel: 'cng', body: 'convertible', reason: 'CNG Convertible cars do not exist in the Indian market' },
    { fuel: 'cng', body: 'sports', reason: 'CNG Sports cars do not exist in the Indian market' },
    { fuel: 'diesel', body: 'convertible', reason: 'Diesel Convertible cars are not available in India' },
    { fuel: 'ev', body: 'convertible', reason: 'EV Convertible cars are not available in the Indian market' },
    { fuel: 'hydrogen', body: 'convertible', reason: 'Hydrogen cars are not yet in the Indian market' },
];
class SeoCombinationValidatorService {
    static validate(params) {
        if (!params.fuel_type_slugs?.length || !params.body_type_slugs?.length) {
            return { valid: true };
        }
        for (const combo of INVALID_COMBOS) {
            const hasFuel = params.fuel_type_slugs.some(f => f.toLowerCase().includes(combo.fuel));
            const hasBody = params.body_type_slugs.some(b => b.toLowerCase().includes(combo.body));
            if (hasFuel && hasBody) {
                return { valid: false, reason: combo.reason };
            }
        }
        return { valid: true };
    }
    static getInvalidCombos() {
        return INVALID_COMBOS;
    }
}
exports.SeoCombinationValidatorService = SeoCombinationValidatorService;
