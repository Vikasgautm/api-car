/**
 * Verification harness: feed every Tata Sierra Smart Plus row from CarDekho
 * (snapshot 2026-05-16) through the canonical SPEC_LABEL_MAP and report
 * match rate, unmapped labels, and derived feature flags.
 *
 * Run: npx ts-node scripts/verify-tata-sierra-import.ts
 */
import {
  deriveFeatureFlags,
  getSpecMapping,
  isInvalidLabel,
  normalizeLabel,
  parseSpecValue,
} from '../src/modules/variants/utils/spec-key-map';

// Raw rows as CarDekho presents them on
// https://www.cardekho.com/overview/Tata_Sierra/Tata_Sierra_Smart_Plus.htm
const ROWS: Array<{ section: string; label: string; value: string }> = [
  // Engine & Transmission
  { section: 'Engine & Transmission', label: 'Engine Type', value: '1.5L Revotron' },
  { section: 'Engine & Transmission', label: 'Displacement', value: '1498 cc' },
  { section: 'Engine & Transmission', label: 'Max Power', value: '105bhp@6000rpm' },
  { section: 'Engine & Transmission', label: 'Max Torque', value: '145Nm@2100rpm' },
  { section: 'Engine & Transmission', label: 'No. of Cylinders', value: '4' },
  { section: 'Engine & Transmission', label: 'Valves Per Cylinder', value: '4' },
  { section: 'Engine & Transmission', label: 'Fuel Supply System', value: 'Atkinson' },
  { section: 'Engine & Transmission', label: 'Turbo Charger', value: 'No' },
  { section: 'Engine & Transmission', label: 'Transmission Type', value: 'Manual' },
  { section: 'Engine & Transmission', label: 'Gearbox', value: '6 Speed' },
  { section: 'Engine & Transmission', label: 'Drive Type', value: 'FWD' },
  // Fuel & Performance
  { section: 'Fuel & Performance', label: 'Fuel Type', value: 'Petrol' },
  { section: 'Fuel & Performance', label: 'Petrol Fuel Tank Capacity', value: '50 Litres' },
  { section: 'Fuel & Performance', label: 'Emission Norm Compliance', value: 'BS VI 2.0' },
  // Suspension, Steering & Brakes
  { section: 'Suspension, Steering & Brakes', label: 'Front Suspension', value: 'MacPherson Strut suspension' },
  { section: 'Suspension, Steering & Brakes', label: 'Rear Suspension', value: 'Rear twist beam' },
  { section: 'Suspension, Steering & Brakes', label: 'Steering Type', value: 'Electric' },
  { section: 'Suspension, Steering & Brakes', label: 'Steering Column', value: 'Tilt & Telescopic' },
  { section: 'Suspension, Steering & Brakes', label: 'Turning Radius', value: '5.3' },
  { section: 'Suspension, Steering & Brakes', label: 'Front Brake Type', value: 'Disc' },
  { section: 'Suspension, Steering & Brakes', label: 'Rear Brake Type', value: 'Disc' },
  { section: 'Suspension, Steering & Brakes', label: 'Boot Space Rear Seat Folding', value: '1257 Litres' },
  // Dimensions & Capacity
  { section: 'Dimensions & Capacity', label: 'Length', value: '4340 mm' },
  { section: 'Dimensions & Capacity', label: 'Width', value: '1841 mm' },
  { section: 'Dimensions & Capacity', label: 'Height', value: '1715 mm' },
  { section: 'Dimensions & Capacity', label: 'Boot Space', value: '622 Litres' },
  { section: 'Dimensions & Capacity', label: 'Seating Capacity', value: '5' },
  { section: 'Dimensions & Capacity', label: 'Ground Clearance Unladen', value: '205 mm' },
  { section: 'Dimensions & Capacity', label: 'Wheel Base', value: '2730 mm' },
  { section: 'Dimensions & Capacity', label: 'No. of Doors', value: '5' },
  // Comfort & Convenience
  { section: 'Comfort & Convenience', label: 'Power Steering', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Air Conditioner', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Heater', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Adjustable Steering', value: 'Height & Reach' },
  { section: 'Comfort & Convenience', label: 'Height Adjustable Driver Seat', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Ventilated Seats', value: 'No' },
  { section: 'Comfort & Convenience', label: 'Electric Adjustable Seats', value: 'No' },
  { section: 'Comfort & Convenience', label: 'Automatic Climate Control', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Air Quality Control', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Accessory Power Outlet', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Trunk Light', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Vanity Mirror', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Rear Reading Lamp', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Rear Seat Headrest', value: 'Integrated' },
  { section: 'Comfort & Convenience', label: 'Adjustable Headrest', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Rear Seat Centre Arm Rest', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Height Adjustable Front Seat Belts', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Rear AC Vents', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Cruise Control', value: 'No' },
  { section: 'Comfort & Convenience', label: 'Parking Sensors', value: 'Rear' },
  { section: 'Comfort & Convenience', label: 'Foldable Rear Seat', value: 'Bench Folding' },
  { section: 'Comfort & Convenience', label: 'KeyLess Entry', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Engine Start/Stop Button', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Cooled Glovebox', value: 'No' },
  { section: 'Comfort & Convenience', label: 'Voice Commands', value: 'No' },
  { section: 'Comfort & Convenience', label: 'Paddle Shifters', value: 'No' },
  { section: 'Comfort & Convenience', label: 'USB Charger', value: 'Front' },
  { section: 'Comfort & Convenience', label: 'Central Console Armrest', value: 'With Storage' },
  { section: 'Comfort & Convenience', label: 'Tailgate Ajar Warning', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Hands-Free Tailgate', value: 'No' },
  { section: 'Comfort & Convenience', label: 'Drive Modes', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Idle Start-Stop System', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Rear Window Sunblind', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Follow Me Home Headlamps', value: 'Yes' },
  { section: 'Comfort & Convenience', label: 'Voice assisted sunroof', value: 'No' },
  { section: 'Comfort & Convenience', label: 'Power Windows', value: 'Front & Rear' },
  { section: 'Comfort & Convenience', label: 'Cup Holders', value: 'Front Only' },
  // Interior
  { section: 'Interior', label: 'Tachometer', value: 'Yes' },
  { section: 'Interior', label: 'Leather Wrapped Steering Wheel', value: 'Yes' },
  { section: 'Interior', label: 'Leather wrap gear-shift selector', value: 'Yes' },
  { section: 'Interior', label: 'Glove Box', value: 'Yes' },
  { section: 'Interior', label: 'Digital Cluster', value: 'Yes' },
  { section: 'Interior', label: 'Digital Cluster Size', value: '4' },
  { section: 'Interior', label: 'Upholstery', value: 'Fabric' },
  // Exterior
  { section: 'Exterior', label: 'Rain Sensing Wiper', value: 'No' },
  { section: 'Exterior', label: 'Rear Window Wiper', value: 'Yes' },
  { section: 'Exterior', label: 'Rear Window Washer', value: 'Yes' },
  { section: 'Exterior', label: 'Rear Window Defogger', value: 'Yes' },
  { section: 'Exterior', label: 'Wheel Covers', value: 'Yes' },
  { section: 'Exterior', label: 'Alloy Wheels', value: 'No' },
  { section: 'Exterior', label: 'Rear Spoiler', value: 'No' },
  { section: 'Exterior', label: 'Outside Rear View Mirror Turn Indicators', value: 'Yes' },
  { section: 'Exterior', label: 'Integrated Antenna', value: 'Yes' },
  { section: 'Exterior', label: 'Projector Headlamps', value: 'Yes' },
  { section: 'Exterior', label: 'Cornering Foglamps', value: 'No' },
  { section: 'Exterior', label: 'Roof Rails', value: 'Yes' },
  { section: 'Exterior', label: 'Automatic Headlamps', value: 'No' },
  { section: 'Exterior', label: 'Fog Lights', value: 'Yes' },
  { section: 'Exterior', label: 'Antenna', value: 'Shark Fin' },
  { section: 'Exterior', label: 'Sunroof', value: 'Yes' },
  { section: 'Exterior', label: 'Boot Opening', value: 'Powered' },
  { section: 'Exterior', label: 'Puddle Lamps', value: 'Yes' },
  { section: 'Exterior', label: 'Outside Rear View Mirror (ORVM)', value: 'Powered' },
  { section: 'Exterior', label: 'Tyre Size', value: '215/65 R17' },
  { section: 'Exterior', label: 'Tyre Type', value: 'Radial & Tubeless' },
  { section: 'Exterior', label: 'Wheel Size', value: '17 Inch' },
  { section: 'Exterior', label: 'LED DRLs', value: 'Yes' },
  { section: 'Exterior', label: 'LED Headlamps', value: 'Yes' },
  { section: 'Exterior', label: 'LED Taillights', value: 'Yes' },
  { section: 'Exterior', label: 'LED Fog Lamps', value: 'No' },
  { section: 'Exterior', label: 'Additional Features', value: 'Flush door handles' },
  // Safety
  { section: 'Safety', label: 'Anti-lock Braking System (ABS)', value: 'Yes' },
  { section: 'Safety', label: 'Brake Assist', value: 'Yes' },
  { section: 'Safety', label: 'Central Locking', value: 'Yes' },
  { section: 'Safety', label: 'Child Safety Locks', value: 'Yes' },
  { section: 'Safety', label: 'Anti-Theft Alarm', value: 'Yes' },
  { section: 'Safety', label: 'No. of Airbags', value: '6' },
  { section: 'Safety', label: 'Driver Airbag', value: 'Yes' },
  { section: 'Safety', label: 'Passenger Airbag', value: 'Yes' },
  { section: 'Safety', label: 'Side Airbag', value: 'Yes' },
  { section: 'Safety', label: 'Day & Night Rear View Mirror', value: 'Yes' },
  { section: 'Safety', label: 'Curtain Airbag', value: 'Yes' },
  { section: 'Safety', label: 'Electronic Brakeforce Distribution (EBD)', value: 'Yes' },
  { section: 'Safety', label: 'Seat Belt Warning', value: 'Yes' },
  { section: 'Safety', label: 'Door Ajar Warning', value: 'Yes' },
  { section: 'Safety', label: 'Traction Control', value: 'Yes' },
  { section: 'Safety', label: 'Tyre Pressure Monitoring System (TPMS)', value: 'Yes' },
  { section: 'Safety', label: 'Engine Immobilizer', value: 'Yes' },
  { section: 'Safety', label: 'Electronic Stability Control (ESC)', value: 'Yes' },
  { section: 'Safety', label: 'Rear Camera', value: 'Yes' },
  { section: 'Safety', label: 'Speed Alert', value: 'Yes' },
  { section: 'Safety', label: 'Speed Sensing Auto Door Lock', value: 'Yes' },
  { section: 'Safety', label: 'ISOFIX Child Seat Mounts', value: 'Yes' },
  { section: 'Safety', label: 'Heads-Up Display (HUD)', value: 'No' },
  { section: 'Safety', label: 'Pretensioners & Force Limiter Seatbelts', value: 'Driver and Passenger' },
  { section: 'Safety', label: 'Hill Descent Control', value: 'No' },
  { section: 'Safety', label: 'Hill Assist', value: 'Yes' },
  { section: 'Safety', label: 'Impact Sensing Auto Door Unlock', value: 'Yes' },
  { section: 'Safety', label: '360 View Camera', value: 'No' },
  { section: 'Safety', label: 'Bharat NCAP Safety Rating', value: '5 Star' },
  { section: 'Safety', label: 'Bharat NCAP Child Safety Rating', value: '5 Star' },
  // Entertainment & Communication
  { section: 'Entertainment & Communication', label: 'Radio', value: 'Yes' },
  { section: 'Entertainment & Communication', label: 'Wireless Phone Charging', value: 'No' },
  { section: 'Entertainment & Communication', label: 'Bluetooth Connectivity', value: 'Yes' },
  { section: 'Entertainment & Communication', label: 'Touchscreen', value: 'Yes' },
  { section: 'Entertainment & Communication', label: 'Android Auto', value: 'Yes' },
  { section: 'Entertainment & Communication', label: 'Apple CarPlay', value: 'Yes' },
  { section: 'Entertainment & Communication', label: 'USB Ports', value: 'Yes' },
  { section: 'Entertainment & Communication', label: 'Speakers', value: 'Yes' },
  // ADAS
  { section: 'ADAS Features', label: 'Forward Collision Warning', value: 'No' },
  { section: 'ADAS Features', label: 'Automatic Emergency Braking', value: 'No' },
  { section: 'ADAS Features', label: 'Speed Assist System', value: 'No' },
  { section: 'ADAS Features', label: 'Traffic Sign Recognition', value: 'No' },
  { section: 'ADAS Features', label: 'Blind Spot Collision Avoidance Assist', value: 'No' },
  { section: 'ADAS Features', label: 'Lane Departure Warning', value: 'No' },
  { section: 'ADAS Features', label: 'Lane Keep Assist', value: 'No' },
  { section: 'ADAS Features', label: 'Lane Departure Prevention Assist', value: 'No' },
  { section: 'ADAS Features', label: 'Driver Attention Warning', value: 'No' },
  { section: 'ADAS Features', label: 'Adaptive Cruise Control', value: 'No' },
  { section: 'ADAS Features', label: 'Adaptive High Beam Assist', value: 'No' },
  { section: 'ADAS Features', label: 'Rear Cross Traffic Alert', value: 'No' },
  { section: 'ADAS Features', label: 'Rear Cross Traffic Collision-Avoidance Assist', value: 'No' },
  { section: 'ADAS Features', label: 'Blind Spot Monitor', value: 'No' },
  // Advanced Internet Features
  { section: 'Advanced Internet Features', label: 'Navigation with Live Traffic', value: 'Yes' },
  { section: 'Advanced Internet Features', label: 'E-Call & I-Call', value: 'Yes' },
  { section: 'Advanced Internet Features', label: 'Google / Alexa Connectivity', value: 'Yes' },
  { section: 'Advanced Internet Features', label: 'SOS Button', value: 'Yes' },
];

interface MatchedRow {
  label: string;
  normalized: string;
  value: string;
  matchedKey: string;
  category: string;
  path: string;
  parsedValue: unknown;
}

interface UnmappedRow {
  label: string;
  normalized: string;
  value: string;
  section: string;
}

const matched: MatchedRow[] = [];
const unmapped: UnmappedRow[] = [];

for (const row of ROWS) {
  if (isInvalidLabel(row.label)) continue;
  const normalized = normalizeLabel(row.label);
  const mapping = getSpecMapping(row.label);
  if (mapping) {
    const parsed = parseSpecValue(row.value, mapping.type);
    matched.push({
      label: row.label,
      normalized,
      value: row.value,
      matchedKey: mapping.key,
      category: mapping.category,
      path: mapping.path || mapping.rootKey || '',
      parsedValue: parsed,
    });
  } else {
    unmapped.push({
      label: row.label,
      normalized,
      value: row.value,
      section: row.section,
    });
  }
}

// Build specs_normalized / specs_raw from matched rows (mirrors key-matcher logic)
const specs_normalized: any = {};
const specs_raw: any = {};
for (const m of matched) {
  if (!m.path) continue;
  const parts = m.path.split('.');
  if (parts[0] === 'specs_raw') {
    let cur = specs_raw;
    for (let i = 1; i < parts.length - 1; i++) {
      cur[parts[i]] = cur[parts[i]] || {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = m.parsedValue;
  } else if (parts[0] === 'specs_normalized') {
    let cur = specs_normalized;
    for (let i = 1; i < parts.length - 1; i++) {
      cur[parts[i]] = cur[parts[i]] || {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = m.parsedValue;
  }
}

// Derive feature flags
const rootFuelType = matched.find(m => m.path === 'fuel_type')?.parsedValue as string | undefined;
const derived = deriveFeatureFlags(specs_normalized, specs_raw, { fuel_type: rootFuelType });

console.log('═══════════════════════════════════════════════════════════════');
console.log('  TATA SIERRA SMART PLUS — IMPORT MATCH-RATE VERIFICATION');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Total rows fed:        ${ROWS.length}`);
console.log(`Matched (canonical):   ${matched.length}`);
console.log(`Unmapped:              ${unmapped.length}`);
console.log(`Match rate:            ${((matched.length / ROWS.length) * 100).toFixed(1)}%`);
console.log('───────────────────────────────────────────────────────────────');
console.log('Match rate by section:');
const sectionTotals: Record<string, { matched: number; total: number }> = {};
for (const r of ROWS) {
  sectionTotals[r.section] = sectionTotals[r.section] || { matched: 0, total: 0 };
  sectionTotals[r.section].total++;
}
for (const m of matched) {
  // Find original row to bucket by section
  const orig = ROWS.find(r => r.label === m.label);
  if (orig) sectionTotals[orig.section].matched++;
}
for (const [section, t] of Object.entries(sectionTotals)) {
  const pct = ((t.matched / t.total) * 100).toFixed(0);
  console.log(`  ${section.padEnd(40)} ${t.matched}/${t.total}  (${pct}%)`);
}

if (unmapped.length > 0) {
  console.log('───────────────────────────────────────────────────────────────');
  console.log('UNMAPPED LABELS (would land in ImportLog.unmatched_data):');
  for (const u of unmapped) {
    console.log(`  [${u.section}] "${u.label}" → normalized: "${u.normalized}" = ${JSON.stringify(u.value)}`);
  }
}

console.log('───────────────────────────────────────────────────────────────');
console.log('DERIVED FEATURE FLAGS (specs_raw.derived):');
console.log(JSON.stringify(derived, null, 2));

console.log('───────────────────────────────────────────────────────────────');
console.log('SAMPLE specs_normalized.safety:');
console.log(JSON.stringify(specs_normalized.safety, null, 2));

console.log('───────────────────────────────────────────────────────────────');
console.log('SAMPLE specs_normalized.adas:');
console.log(JSON.stringify(specs_normalized.adas, null, 2));

console.log('───────────────────────────────────────────────────────────────');
console.log('SAMPLE specs_normalized.comfort_convenience:');
console.log(JSON.stringify(specs_normalized.comfort_convenience, null, 2));
