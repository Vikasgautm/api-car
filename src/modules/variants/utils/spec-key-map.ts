export interface SpecMapping {
  category: string;
  key: string;
  path?: string;
  rootKey?: string;
  type: 'string' | 'number' | 'boolean' | 'transmission';
}

export const SPEC_LABEL_MAP: Record<string, SpecMapping> = {
  'engine type': {
    category: 'engine_performance',
    key: 'engine_type',
    path: 'specs_normalized.engine_performance.engine_type',
    type: 'string',
  },
  'displacement': {
    category: 'engine_performance',
    key: 'displacement',
    path: 'specs_normalized.engine_performance.displacement',
    type: 'string',
  },
  'max power': {
    category: 'engine_performance',
    key: 'max_power',
    path: 'specs_normalized.engine_performance.max_power',
    type: 'string',
  },
  'max torque': {
    category: 'engine_performance',
    key: 'max_torque',
    path: 'specs_normalized.engine_performance.max_torque',
    type: 'string',
  },
  'no. of cylinders': {
    category: 'engine_performance',
    key: 'cylinders',
    path: 'specs_normalized.engine_performance.cylinders',
    type: 'number',
  },
  'number of cylinders': {
    category: 'engine_performance',
    key: 'cylinders',
    path: 'specs_normalized.engine_performance.cylinders',
    type: 'number',
  },
  'valves per cylinder': {
    category: 'engine_performance',
    key: 'valves_per_cylinder',
    path: 'specs_normalized.engine_performance.valves_per_cylinder',
    type: 'number',
  },
  'fuel supply system': {
    category: 'engine_performance',
    key: 'fuel_system',
    path: 'specs_normalized.engine_performance.fuel_system',
    type: 'string',
  },
  'turbo charger': {
    category: 'engine_performance',
    key: 'turbocharger',
    path: 'specs_normalized.engine_performance.turbocharger',
    type: 'boolean',
  },
  'turbocharger': {
    category: 'engine_performance',
    key: 'turbocharger',
    path: 'specs_normalized.engine_performance.turbocharger',
    type: 'boolean',
  },
  'transmission type': {
    category: 'engine_performance',
    key: 'transmission_type',
    rootKey: 'transmission_type',
    type: 'transmission',
  },
  'gearbox': {
    category: 'engine_performance',
    key: 'gearbox',
    path: 'specs_raw.gearbox',
    type: 'string',
  },
  'drive type': {
    category: 'engine_performance',
    key: 'drivetrain',
    rootKey: 'drivetrain',
    type: 'string',
  },
  'fuel type': {
    category: 'engine_performance',
    key: 'fuel_type',
    rootKey: 'fuel_type',
    type: 'string',
  },
  'petrol fuel tank capacity': {
    category: 'mileage_range',
    key: 'fuel_tank_capacity',
    path: 'specs_normalized.mileage_range.fuel_tank_capacity',
    type: 'string',
  },
  'fuel tank capacity': {
    category: 'mileage_range',
    key: 'fuel_tank_capacity',
    path: 'specs_normalized.mileage_range.fuel_tank_capacity',
    type: 'string',
  },
  'emission norm compliance': {
    category: 'mileage_range',
    key: 'emission_standard',
    path: 'specs_normalized.mileage_range.emission_standard',
    type: 'string',
  },
  'front suspension': {
    category: 'suspension_steering_brakes',
    key: 'front_suspension',
    path: 'specs_normalized.suspension_steering_brakes.front_suspension',
    type: 'string',
  },
  'rear suspension': {
    category: 'suspension_steering_brakes',
    key: 'rear_suspension',
    path: 'specs_normalized.suspension_steering_brakes.rear_suspension',
    type: 'string',
  },
  'steering type': {
    category: 'suspension_steering_brakes',
    key: 'steering_type',
    path: 'specs_normalized.suspension_steering_brakes.steering_type',
    type: 'string',
  },
  'steering column': {
    category: 'suspension_steering_brakes',
    key: 'steering_column',
    path: 'specs_normalized.suspension_steering_brakes.steering_column',
    type: 'string',
  },
  'front brake type': {
    category: 'suspension_steering_brakes',
    key: 'front_brake_type',
    path: 'specs_normalized.suspension_steering_brakes.front_brake_type',
    type: 'string',
  },
  'rear brake type': {
    category: 'suspension_steering_brakes',
    key: 'rear_brake_type',
    path: 'specs_normalized.suspension_steering_brakes.rear_brake_type',
    type: 'string',
  },
  'length': {
    category: 'dimensions_practicality',
    key: 'length',
    path: 'specs_normalized.dimensions_practicality.length',
    type: 'string',
  },
  'width': {
    category: 'dimensions_practicality',
    key: 'width',
    path: 'specs_normalized.dimensions_practicality.width',
    type: 'string',
  },
  'height': {
    category: 'dimensions_practicality',
    key: 'height',
    path: 'specs_normalized.dimensions_practicality.height',
    type: 'string',
  },
  'wheel base': {
    category: 'dimensions_practicality',
    key: 'wheelbase',
    path: 'specs_normalized.dimensions_practicality.wheelbase',
    type: 'string',
  },
  'wheelbase': {
    category: 'dimensions_practicality',
    key: 'wheelbase',
    path: 'specs_normalized.dimensions_practicality.wheelbase',
    type: 'string',
  },
  'ground clearance unladen': {
    category: 'dimensions_practicality',
    key: 'ground_clearance',
    path: 'specs_normalized.dimensions_practicality.ground_clearance',
    type: 'string',
  },
  'boot space': {
    category: 'dimensions_practicality',
    key: 'boot_space',
    path: 'specs_normalized.dimensions_practicality.boot_space',
    type: 'string',
  },
  'boot space rear seat folding': {
    category: 'dimensions_practicality',
    key: 'boot_space_rear_seat_folding',
    path: 'specs_raw.boot_space_rear_seat_folding',
    type: 'string',
  },
  'seating capacity': {
    category: 'dimensions_practicality',
    key: 'seating_capacity',
    path: 'specs_normalized.dimensions_practicality.seating_capacity',
    rootKey: 'seating_capacity',
    type: 'number',
  },
  'no. of doors': {
    category: 'dimensions_practicality',
    key: 'doors',
    path: 'specs_normalized.dimensions_practicality.doors',
    type: 'number',
  },
  'number of doors': {
    category: 'dimensions_practicality',
    key: 'doors',
    path: 'specs_normalized.dimensions_practicality.doors',
    type: 'number',
  },
  'tyre size': {
    category: 'tyres_wheels',
    key: 'tyre_size',
    path: 'specs_normalized.tyres_wheels.tyre_size',
    type: 'string',
  },
  'tyre type': {
    category: 'tyres_wheels',
    key: 'tyre_type',
    path: 'specs_normalized.tyres_wheels.tyre_type',
    type: 'string',
  },
  'wheel size': {
    category: 'tyres_wheels',
    key: 'wheel_size',
    path: 'specs_normalized.tyres_wheels.wheel_size',
    type: 'string',
  },
  'no. of airbags': {
    category: 'safety',
    key: 'airbags',
    path: 'specs_normalized.safety.airbags',
    type: 'number',
  },
  'number of airbags': {
    category: 'safety',
    key: 'airbags',
    path: 'specs_normalized.safety.airbags',
    type: 'number',
  },
  'parking sensors': {
    category: 'safety',
    key: 'parking_sensors',
    path: 'specs_normalized.safety.parking_sensors',
    type: 'string',
  },
  'bharat ncap safety rating': {
    category: 'safety',
    key: 'bharat_ncap_safety_rating',
    path: 'specs_raw.bharat_ncap_safety_rating',
    type: 'string',
  },
  'bharat ncap child safety rating': {
    category: 'safety',
    key: 'bharat_ncap_child_safety_rating',
    path: 'specs_raw.bharat_ncap_child_safety_rating',
    type: 'string',
  },
  'adjustable steering': {
    category: 'comfort_convenience',
    key: 'steering_adjustment',
    path: 'specs_normalized.comfort_convenience.steering_adjustment',
    type: 'string',
  },
  'foldable rear seat': {
    category: 'comfort_convenience',
    key: 'folding_rear_seats',
    path: 'specs_normalized.comfort_convenience.folding_rear_seats',
    type: 'string',
  },
  'power windows': {
    category: 'comfort_convenience',
    key: 'power_windows',
    path: 'specs_normalized.comfort_convenience.power_windows',
    type: 'string',
  },
  'usb charger': {
    category: 'infotainment_connectivity',
    key: 'usb_ports',
    path: 'specs_raw.usb_charger',
    type: 'string',
  },
  'upholstery': {
    category: 'interior',
    key: 'interior_material',
    path: 'specs_normalized.interior.interior_material',
    type: 'string',
  },
  'outside rear view mirror orvm': {
    category: 'exterior',
    key: 'orvm',
    path: 'specs_raw.orvm',
    type: 'string',
  },
  'outside rear view mirror (orvm)': {
    category: 'exterior',
    key: 'orvm',
    path: 'specs_raw.orvm',
    type: 'string',
  },
};

// Invalid labels to filter out
export const INVALID_LABELS = [
  'report incorrect specs',
  'report incorrect',
  'click to report',
  'report',
  'incorrect',
  'edit',
  'modify',
  'update specs',
];

export function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/&/g, 'and')
    .trim();
}

export function isInvalidLabel(label: string): boolean {
  const normalized = normalizeLabel(label);
  return INVALID_LABELS.some(invalid => normalized.includes(invalid));
}

export function getSpecMapping(label: string): SpecMapping | null {
  const normalized = normalizeLabel(label);
  return SPEC_LABEL_MAP[normalized] || null;
}

export function parseSpecValue(value: string, type: SpecMapping['type']): any {
  if (!value) return null;

  const trimmed = value.trim();

  switch (type) {
    case 'number':
      // Extract number from string
      const numMatch = trimmed.match(/[\d.]+/);
      if (numMatch) {
        const num = parseFloat(numMatch[0]);
        return isNaN(num) ? null : num;
      }
      return null;

    case 'boolean':
      const lower = trimmed.toLowerCase();
      if (lower === 'yes' || lower === 'true' || lower === 'available') {
        return true;
      }
      if (lower === 'no' || lower === 'false' || lower === 'not available') {
        return false;
      }
      return null;

    case 'transmission':
      // Will be handled separately by normalizeTransmission
      return trimmed;

    case 'string':
    default:
      return trimmed;
  }
}
