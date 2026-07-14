import { v4 as uuidv4 } from 'uuid';

export interface IMasterOption {
  option_id: string;
  category_key: string;   // e.g. 'transmission', 'drive_type', 'drive_modes'
  label: string;          // Display label shown in UI
  value: string;          // Stored value (slug form)
  sort_order: number;
  is_active: boolean;
  is_system: boolean;     // System defaults — cannot be deleted, only deactivated
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// ── Catalogue of all managed categories ───────────────────────────────────────
export interface MasterCategory {
  key: string;
  label: string;
  description: string;
  multi_select: boolean; // true = multi-select field in variant editor
}

export const MASTER_CATEGORIES: MasterCategory[] = [
  { key: 'transmission',       label: 'Transmission Types',      description: 'Gearbox/transmission options',             multi_select: false },
  { key: 'drive_type',         label: 'Drive Types',             description: 'Drivetrain / drive layout',                multi_select: false },
  { key: 'gearbox',            label: 'Gearbox Speeds',          description: 'Gearbox speed count (5-speed, 6-speed…)',   multi_select: false },
  { key: 'sunroof_type',       label: 'Sunroof Types',           description: 'Sunroof / glass roof variants',             multi_select: false },
  { key: 'parking_sensor',     label: 'Parking Sensor Types',    description: 'PDC / parking sensor options',             multi_select: false },
  { key: 'headlamp_type',      label: 'Headlamp Types',          description: 'Headlight technology options',             multi_select: false },
  { key: 'seat_upholstery',    label: 'Seat Upholstery',         description: 'Seat material / upholstery options',        multi_select: false },
  { key: 'instrument_cluster', label: 'Instrument Cluster',      description: 'Cluster display types',                    multi_select: false },
  { key: 'battery_type',       label: 'Battery Types',           description: 'EV/Hybrid battery chemistry types',        multi_select: false },
  { key: 'battery_cooling',    label: 'Battery Cooling',         description: 'Battery thermal management options',       multi_select: false },
  { key: 'charging_port',      label: 'Charging Port Types',     description: 'EV charging connector standards',          multi_select: false },
  { key: 'drive_modes',        label: 'Drive Modes',             description: 'Selectable driving modes (multi-select)',  multi_select: true  },
  { key: 'terrain_modes',      label: 'Terrain Modes',           description: 'Off-road terrain modes (multi-select)',    multi_select: true  },
  { key: 'charging_options',   label: 'Charging Options',        description: 'EV charging capability options (multi)',   multi_select: true  },
];

// ── Seed data ─────────────────────────────────────────────────────────────────
export const MASTER_SEED_DATA: Record<string, { label: string; value: string }[]> = {
  transmission: [
    { label: 'Manual',              value: 'manual' },
    { label: 'Automatic',           value: 'automatic' },
    { label: 'AMT',                 value: 'amt' },
    { label: 'CVT',                 value: 'cvt' },
    { label: 'DCT',                 value: 'dct' },
    { label: 'DSG',                 value: 'dsg' },
    { label: 'iMT',                 value: 'imt' },
    { label: 'Torque Converter',    value: 'torque_converter' },
    { label: 'Single-Speed EV',     value: 'single_speed_ev' },
    { label: 'e-CVT',               value: 'e_cvt' },
    { label: 'Other',               value: 'other' },
  ],
  drive_type: [
    { label: 'FWD',             value: 'fwd' },
    { label: 'RWD',             value: 'rwd' },
    { label: 'AWD',             value: 'awd' },
    { label: '4WD',             value: '4wd' },
    { label: '2WD',             value: '2wd' },
    { label: '4x2',             value: '4x2' },
    { label: '4x4',             value: '4x4' },
    { label: 'e-AWD',           value: 'e_awd' },
    { label: 'i-AWD',           value: 'i_awd' },
    { label: 'Dual Motor AWD',  value: 'dual_motor_awd' },
    { label: 'Other',           value: 'other' },
  ],
  gearbox: [
    { label: '5-Speed',     value: '5_speed' },
    { label: '6-Speed',     value: '6_speed' },
    { label: '7-Speed',     value: '7_speed' },
    { label: '8-Speed',     value: '8_speed' },
    { label: '9-Speed',     value: '9_speed' },
    { label: '10-Speed',    value: '10_speed' },
    { label: 'Single Speed', value: 'single_speed' },
    { label: 'Other',       value: 'other' },
  ],
  sunroof_type: [
    { label: 'Not Available',          value: 'not_available' },
    { label: 'Electric Sunroof',       value: 'electric_sunroof' },
    { label: 'Panoramic Sunroof',      value: 'panoramic_sunroof' },
    { label: 'Dual Pane Panoramic',    value: 'dual_pane_panoramic' },
    { label: 'Fixed Glass Roof',       value: 'fixed_glass_roof' },
    { label: 'Other',                  value: 'other' },
  ],
  parking_sensor: [
    { label: 'Not Available',  value: 'not_available' },
    { label: 'Rear',           value: 'rear' },
    { label: 'Front & Rear',   value: 'front_rear' },
    { label: '360 Sensor',     value: '360_sensor' },
    { label: 'Other',          value: 'other' },
  ],
  headlamp_type: [
    { label: 'Halogen',           value: 'halogen' },
    { label: 'Projector Halogen', value: 'projector_halogen' },
    { label: 'LED',               value: 'led' },
    { label: 'Projector LED',     value: 'projector_led' },
    { label: 'Matrix LED',        value: 'matrix_led' },
    { label: 'Laser',             value: 'laser' },
    { label: 'Other',             value: 'other' },
  ],
  seat_upholstery: [
    { label: 'Fabric',         value: 'fabric' },
    { label: 'Leatherette',    value: 'leatherette' },
    { label: 'Leather',        value: 'leather' },
    { label: 'Vegan Leather',  value: 'vegan_leather' },
    { label: 'Mixed',          value: 'mixed' },
    { label: 'Other',          value: 'other' },
  ],
  instrument_cluster: [
    { label: 'Analog',        value: 'analog' },
    { label: 'Semi Digital',  value: 'semi_digital' },
    { label: 'Digital',       value: 'digital' },
    { label: 'Dual Screen',   value: 'dual_screen' },
    { label: 'Other',         value: 'other' },
  ],
  battery_type: [
    { label: 'LFP',          value: 'lfp' },
    { label: 'NMC',          value: 'nmc' },
    { label: 'NCA',          value: 'nca' },
    { label: 'Lithium Ion',  value: 'lithium_ion' },
    { label: 'Blade Battery', value: 'blade_battery' },
    { label: 'Solid State',  value: 'solid_state' },
    { label: 'Other',        value: 'other' },
  ],
  battery_cooling: [
    { label: 'Air Cooled',    value: 'air_cooled' },
    { label: 'Liquid Cooled', value: 'liquid_cooled' },
    { label: 'Passive',       value: 'passive' },
    { label: 'Other',         value: 'other' },
  ],
  charging_port: [
    { label: 'CCS2',    value: 'ccs2' },
    { label: 'CHAdeMO', value: 'chademo' },
    { label: 'GB/T',    value: 'gbt' },
    { label: 'NACS',    value: 'nacs' },
    { label: 'Type 2',  value: 'type2' },
    { label: 'Other',   value: 'other' },
  ],
  drive_modes: [
    { label: 'Eco',    value: 'eco' },
    { label: 'Normal', value: 'normal' },
    { label: 'Sport',  value: 'sport' },
    { label: 'Snow',   value: 'snow' },
    { label: 'Mud',    value: 'mud' },
    { label: 'Sand',   value: 'sand' },
    { label: 'Rock',   value: 'rock' },
    { label: 'Track',  value: 'track' },
    { label: 'Custom', value: 'custom' },
    { label: 'EV',     value: 'ev' },
    { label: 'Other',  value: 'other' },
  ],
  terrain_modes: [
    { label: 'Snow',    value: 'snow' },
    { label: 'Mud',     value: 'mud' },
    { label: 'Sand',    value: 'sand' },
    { label: 'Rock',    value: 'rock' },
    { label: 'Grass',   value: 'grass' },
    { label: 'Gravel',  value: 'gravel' },
    { label: 'Other',   value: 'other' },
  ],
  charging_options: [
    { label: 'AC Charging',      value: 'ac_charging' },
    { label: 'DC Fast Charging', value: 'dc_fast_charging' },
    { label: 'Home Charger',     value: 'home_charger' },
    { label: 'Portable Charger', value: 'portable_charger' },
    { label: 'V2L',              value: 'v2l' },
    { label: 'V2V',              value: 'v2v' },
    { label: 'Other',            value: 'other' },
  ],
};

import { BaseModel } from '../../../sql/common/BaseModel';
export const MasterOption = new BaseModel<IMasterOption>('MasterOptions', 'option_id', ['metadata']);
