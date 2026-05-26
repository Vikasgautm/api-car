"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomotiveValidationRules = void 0;
class AutomotiveValidationRules {
    static rules = [
        // EV-specific validations
        {
            name: 'ev_fuel_tank_conflict',
            description: 'EVs cannot have fuel tank capacity',
            severity: 'error',
            validate: (v) => {
                const isEV = v.fuel_type_id === 'electric' || v.transmission_type === 'single_speed_ev';
                const hasFuelTank = v.specs_normalized?.mileage_range?.fuel_tank_capacity;
                return !(isEV && hasFuelTank);
            },
            errorMessage: () => 'Electric vehicles cannot have fuel tank capacity',
        },
        {
            name: 'ev_requires_battery',
            description: 'EVs must have battery capacity',
            severity: 'error',
            validate: (v) => {
                const isEV = v.fuel_type_id === 'electric';
                const hasBattery = v.specs_normalized?.battery_charging?.battery_capacity;
                return !isEV || hasBattery;
            },
            errorMessage: () => 'Electric vehicles must have battery capacity specified',
        },
        {
            name: 'ev_range_required',
            description: 'EVs must have electric range',
            severity: 'warning',
            validate: (v) => {
                const isEV = v.fuel_type_id === 'electric';
                const hasRange = v.specs_normalized?.battery_charging?.electric_range ||
                    v.specs_normalized?.battery_charging?.real_range;
                return !isEV || hasRange;
            },
            errorMessage: () => 'Electric vehicles should have electric range specified',
        },
        // Drivetrain validations
        {
            name: 'transmission_type_consistency',
            description: 'Single-speed EV transmission cannot be mixed with non-EV fuel types',
            severity: 'error',
            validate: (v) => {
                const isSingleSpeedEV = v.transmission_type === 'single_speed_ev';
                const isEV = v.fuel_type_id === 'electric';
                return !isSingleSpeedEV || isEV;
            },
            errorMessage: () => 'Single-speed EV transmission is only valid for electric vehicles',
        },
        {
            name: 'e_cvt_requires_ev',
            description: 'E-CVT transmission requires electric fuel type',
            severity: 'error',
            validate: (v) => {
                const isECVT = v.transmission_type === 'e_cvt';
                const isEV = v.fuel_type_id === 'electric' || v.transmission_type === 'single_speed_ev';
                return !isECVT || isEV;
            },
            errorMessage: () => 'E-CVT transmission is only valid for electric vehicles',
        },
        // Seating validation
        {
            name: 'seating_capacity_range',
            description: 'Seating capacity must be between 2 and 10',
            severity: 'error',
            validate: (v) => {
                const seating = v.seating_capacity;
                return !seating || (seating >= 2 && seating <= 10);
            },
            errorMessage: () => 'Seating capacity must be between 2 and 10',
        },
        // Price validations
        {
            name: 'price_logic',
            description: 'Expected price should not be significantly lower than ex-showroom',
            severity: 'warning',
            validate: (v) => {
                const exShowroom = v.ex_showroom_price;
                const expected = v.expected_price;
                if (!exShowroom || !expected)
                    return true;
                return expected >= exShowroom * 0.85;
            },
            errorMessage: () => 'Expected price is significantly lower than ex-showroom price (risk of data error)',
        },
        {
            name: 'on_road_price_logic',
            description: 'On-road price should be higher than ex-showroom price',
            severity: 'warning',
            validate: (v) => {
                const exShowroom = v.ex_showroom_price;
                const onRoad = v.on_road_price;
                if (!exShowroom || !onRoad)
                    return true;
                return onRoad >= exShowroom;
            },
            errorMessage: () => 'On-road price should be higher than ex-showroom price',
        },
        // Mileage/Range validations (logic checks only)
        {
            name: 'mileage_consistency',
            description: 'Mileage metrics should be logical (city <= highway typically)',
            severity: 'warning',
            validate: (v) => {
                const city = v.specs_normalized?.mileage_range?.city_mileage;
                const highway = v.specs_normalized?.mileage_range?.highway_mileage;
                if (!city || !highway)
                    return true;
                const cityNum = parseFloat(city);
                const hwNum = parseFloat(highway);
                return isNaN(cityNum) || isNaN(hwNum) || cityNum <= hwNum * 1.5;
            },
            errorMessage: () => 'City mileage vs highway mileage seems illogical',
        },
        // Safety validation
        {
            name: 'ncap_rating_valid',
            description: 'NCAP rating must be 0-5 stars',
            severity: 'error',
            validate: (v) => {
                const rating = v.specs_normalized?.safety?.ncap_rating;
                return !rating || (rating >= 0 && rating <= 5);
            },
            errorMessage: () => 'NCAP rating must be between 0 and 5',
        },
        {
            name: 'adas_level_valid',
            description: 'ADAS level must be 0-5',
            severity: 'error',
            validate: (v) => {
                const level = v.specs_normalized?.safety?.adas_level;
                return !level || (level >= 0 && level <= 5);
            },
            errorMessage: () => 'ADAS level must be between 0 and 5',
        },
        // Dimension validations
        {
            name: 'boot_space_positive',
            description: 'Boot space must be positive number',
            severity: 'warning',
            validate: (v) => {
                const boot = v.specs_normalized?.dimensions_practicality?.boot_space;
                if (!boot)
                    return true;
                const bootNum = parseFloat(boot);
                return isNaN(bootNum) || bootNum > 0;
            },
            errorMessage: () => 'Boot space must be a positive value',
        },
        {
            name: 'ground_clearance_valid',
            description: 'Ground clearance should be 100-300mm (typical range)',
            severity: 'warning',
            validate: (v) => {
                const gc = v.specs_normalized?.dimensions_practicality?.ground_clearance;
                if (!gc)
                    return true;
                const gcNum = parseFloat(gc);
                return isNaN(gcNum) || (gcNum >= 100 && gcNum <= 300);
            },
            errorMessage: () => 'Ground clearance seems outside typical range (100-300mm)',
        },
        // Engine power/torque
        {
            name: 'power_torque_logic',
            description: 'Power and torque should exist together or not at all',
            severity: 'warning',
            validate: (v) => {
                const power = v.specs_normalized?.engine_performance?.max_power;
                const torque = v.specs_normalized?.engine_performance?.max_torque;
                return (power && torque) || (!power && !torque);
            },
            errorMessage: () => 'Power and torque should both be specified or both empty',
        },
        // CNG variant logic
        {
            name: 'cng_consistency',
            description: 'CNG variants should have CNG mileage and tank capacity',
            severity: 'warning',
            validate: (v) => {
                const isCNG = v.fuel_type_id === 'cng' || v.variant_name?.toLowerCase().includes('cng');
                const cngMileage = v.specs_normalized?.mileage_range?.cng_mileage;
                const cngTank = v.specs_normalized?.mileage_range?.cng_tank_capacity;
                return !isCNG || (cngMileage && cngTank);
            },
            errorMessage: () => 'CNG variants must have CNG mileage and tank capacity specified',
        },
        // ── Impossible value detection ─────────────────────────────────────────
        {
            name: 'mileage_impossible_ice',
            description: 'ICE/CNG mileage cannot exceed 50 kmpl — likely a data entry error',
            severity: 'warning',
            validate: (v) => {
                const isEV = (v.fuel_type_id || '').toLowerCase().includes('electric');
                if (isEV)
                    return true;
                const raw = v.specs_normalized?.mileage_range?.arai_mileage;
                if (!raw)
                    return true;
                const n = parseFloat(String(raw));
                return isNaN(n) || n <= 50;
            },
            errorMessage: (v) => `Possible invalid automotive value detected: ARAI mileage "${v.specs_normalized?.mileage_range?.arai_mileage}" exceeds 50 kmpl`,
        },
        {
            name: 'ev_range_impossible',
            description: 'EV range cannot exceed 1000 km — likely a data entry error',
            severity: 'warning',
            validate: (v) => {
                const isEV = (v.fuel_type_id || '').toLowerCase().includes('electric');
                if (!isEV)
                    return true;
                const raw = v.specs_normalized?.battery_charging?.real_world_range || v.specs_normalized?.battery_charging?.battery_wltp_km;
                if (!raw)
                    return true;
                const n = parseFloat(String(raw));
                return isNaN(n) || n <= 1000;
            },
            errorMessage: () => 'Possible invalid automotive value detected: EV range exceeds 1000 km',
        },
        {
            name: 'power_impossible',
            description: 'Engine power cannot exceed 800 bhp for a production car',
            severity: 'warning',
            validate: (v) => {
                const raw = v.specs_normalized?.engine_performance?.max_power;
                if (!raw)
                    return true;
                const m = String(raw).match(/-?\d+(?:\.\d+)?/);
                if (!m)
                    return true;
                const n = Number(m[0]);
                return isNaN(n) || n <= 800;
            },
            errorMessage: (v) => `Possible invalid automotive value detected: power "${v.specs_normalized?.engine_performance?.max_power}" exceeds 800 bhp`,
        },
        {
            name: 'torque_impossible',
            description: 'Torque cannot exceed 1500 Nm for a production car',
            severity: 'warning',
            validate: (v) => {
                const raw = v.specs_normalized?.engine_performance?.max_torque;
                if (!raw)
                    return true;
                const m = String(raw).match(/-?\d+(?:\.\d+)?/);
                if (!m)
                    return true;
                const n = Number(m[0]);
                return isNaN(n) || n <= 1500;
            },
            errorMessage: (v) => `Possible invalid automotive value detected: torque "${v.specs_normalized?.engine_performance?.max_torque}" exceeds 1500 Nm`,
        },
        {
            name: 'airbags_impossible',
            description: 'Airbag count cannot exceed 12 for a production car',
            severity: 'warning',
            validate: (v) => {
                const raw = v.specs_normalized?.safety?.airbags;
                if (raw == null)
                    return true;
                const n = Number(raw);
                return isNaN(n) || n <= 12;
            },
            errorMessage: (v) => `Possible invalid automotive value detected: airbags count "${v.specs_normalized?.safety?.airbags}" exceeds 12`,
        },
        {
            name: 'seating_capacity_impossible',
            description: 'Seating capacity must be between 1 and 10',
            severity: 'error',
            validate: (v) => {
                const n = v.seating_capacity;
                return !n || (n >= 1 && n <= 10);
            },
            errorMessage: (v) => `Possible invalid automotive value detected: seating capacity "${v.seating_capacity}" is outside valid range (1–10)`,
        },
        {
            name: 'acceleration_impossible',
            description: '0-100 kmph acceleration cannot be under 1.5 seconds for a production car',
            severity: 'warning',
            validate: (v) => {
                const raw = v.specs_normalized?.engine_performance?.acceleration_0_100;
                if (!raw)
                    return true;
                const m = String(raw).match(/-?\d+(?:\.\d+)?/);
                if (!m)
                    return true;
                const n = Number(m[0]);
                return isNaN(n) || n >= 1.5;
            },
            errorMessage: (v) => `Possible invalid automotive value detected: 0-100 acceleration "${v.specs_normalized?.engine_performance?.acceleration_0_100}" is under 1.5 seconds`,
        },
    ];
    static validate(variant) {
        const violations = [];
        for (const rule of this.rules) {
            if (!rule.validate(variant)) {
                violations.push({
                    rule: rule.name,
                    message: rule.errorMessage(variant),
                    severity: rule.severity,
                });
            }
        }
        return violations;
    }
    static validateStrict(variant) {
        const violations = this.validate(variant);
        const errors = violations.filter((v) => v.severity === 'error');
        const warnings = violations.filter((v) => v.severity === 'warning');
        return {
            isValid: errors.length === 0,
            errors: errors.map((e) => ({ rule: e.rule, message: e.message })),
            warnings: warnings.map((w) => ({ rule: w.rule, message: w.message })),
        };
    }
}
exports.AutomotiveValidationRules = AutomotiveValidationRules;
//# sourceMappingURL=automotive-validation-rules.js.map