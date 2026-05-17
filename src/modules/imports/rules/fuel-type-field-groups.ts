// ─── EV-ONLY SPEC FIELDS ─────────────────────────────────────────────────────
// Keys that only make sense for pure electric vehicles. Used by the validator
// to reject them on petrol/diesel/CNG variants, and by UI to hide on non-EV.

export const EV_ONLY_NORMALIZED_PATHS: Array<{ category: string; key: string; label: string }> = [
  { category: 'battery_charging', key: 'battery_capacity',      label: 'battery capacity' },
  { category: 'battery_charging', key: 'electric_range',        label: 'electric range' },
  { category: 'battery_charging', key: 'charging_time',         label: 'charging time' },
  { category: 'battery_charging', key: 'motor_type',            label: 'motor type' },
  { category: 'battery_charging', key: 'regenerative_braking',  label: 'regenerative braking' },
  { category: 'battery_charging', key: 'charging_options',      label: 'charging options' },
];

export const EV_ONLY_RAW_KEYS: Array<{ key: string; label: string }> = [
  { key: 'battery_type',       label: 'battery type' },
  { key: 'charging_port',      label: 'charging port' },
  { key: 'fast_charging',      label: 'fast charging' },
  { key: 'charging_time_ac',   label: 'AC charging time' },
  { key: 'charging_time_dc',   label: 'DC charging time' },
  { key: 'motor_power',        label: 'motor power' },
];

// ─── ICE-ONLY SPEC FIELDS ─────────────────────────────────────────────────────
// Keys that only make sense for combustion engines (petrol/diesel/CNG/LPG).
// Rejected on pure EVs.

export const ICE_ONLY_NORMALIZED_PATHS: Array<{ category: string; key: string; label: string }> = [
  { category: 'mileage_range',       key: 'fuel_tank_capacity', label: 'fuel tank capacity' },
  { category: 'mileage_range',       key: 'arai_mileage',       label: 'ARAI mileage' },
  { category: 'mileage_range',       key: 'city_mileage',       label: 'city mileage' },
  { category: 'mileage_range',       key: 'highway_mileage',    label: 'highway mileage' },
  { category: 'mileage_range',       key: 'cng_mileage',        label: 'CNG mileage' },
  { category: 'mileage_range',       key: 'cng_tank_capacity',  label: 'CNG tank capacity' },
  { category: 'engine_performance',  key: 'cylinders',          label: 'number of cylinders' },
  { category: 'engine_performance',  key: 'displacement',       label: 'engine displacement' },
  { category: 'engine_performance',  key: 'fuel_system',        label: 'fuel supply system' },
];

// ─── FUEL TYPE CLASSIFIERS ────────────────────────────────────────────────────

const EV_IDENTIFIERS      = ['electric', 'ev', 'bev', 'battery electric'];
const HYBRID_IDENTIFIERS  = ['hybrid', 'phev', 'mhev', 'mild hybrid', 'strong hybrid', 'plug-in hybrid', 'plug in hybrid'];

export function isElectricFuelType(name: string): boolean {
  const lower = name.toLowerCase().trim();
  // Must be pure EV — hybrids (which also contain "electric") are excluded.
  return EV_IDENTIFIERS.some(id => lower.includes(id)) && !HYBRID_IDENTIFIERS.some(id => lower.includes(id));
}

export function isHybridFuelType(name: string): boolean {
  const lower = name.toLowerCase().trim();
  return HYBRID_IDENTIFIERS.some(id => lower.includes(id));
}
