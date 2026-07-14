"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarVariant = exports.DRIVE_TYPE_VALUES = void 0;
exports.normalizeDriveType = normalizeDriveType;
exports.DRIVE_TYPE_VALUES = [
    'fwd', 'rwd', 'awd', '4wd', '2wd', '4x2', '4x4', 'e_awd', 'i_awd', 'dual_motor_awd', 'other',
];
// Normalizes free-form drivetrain input (e.g. "FWD", "4WD", "AWD", "front", "e-AWD")
// to a canonical DriveType value, or returns null for unrecognised inputs.
function normalizeDriveType(raw) {
    if (!raw)
        return null;
    const key = raw.trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/\//g, '');
    const aliasMap = {
        fwd: 'fwd', front: 'fwd', front_wheel_drive: 'fwd', '2wd': '2wd', '4x2': '4x2',
        rwd: 'rwd', rear: 'rwd', rear_wheel_drive: 'rwd',
        awd: 'awd', all_wheel_drive: 'awd', '4wd': '4wd', four_wheel_drive: '4wd', '4x4': '4x4',
        e_awd: 'e_awd', eawd: 'e_awd', electric_awd: 'e_awd',
        i_awd: 'i_awd', iawd: 'i_awd', intelligent_awd: 'i_awd',
        dual_motor_awd: 'dual_motor_awd', dual_motor: 'dual_motor_awd',
        other: 'other',
    };
    return aliasMap[key] ?? null;
}
const BaseModel_1 = require("../sql/common/BaseModel");
exports.CarVariant = new BaseModel_1.BaseModel('CarVariants', 'variant_id', ['specifications', 'features']);
