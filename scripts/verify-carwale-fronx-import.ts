/**
 * Cross-source verification: feed Carwale's Maruti Fronx Sigma rows
 * (https://www.carwale.com/maruti-suzuki-cars/fronx/sigma/) through the
 * canonical SPEC_LABEL_MAP. Carwale uses different label conventions than
 * CarDekho — this script measures how much the current map covers.
 */
import {
  deriveFeatureFlags,
  getSpecMapping,
  isInvalidLabel,
  normalizeLabel,
  parseSpecValue,
} from '../src/modules/variants/utils/spec-key-map';

const ROWS: Array<{ section: string; label: string; value: string }> = [
  // Engine Performance
  { section: 'Engine Performance', label: 'Engine Type', value: '1.2L Dual Jet, Dual VVT' },
  { section: 'Engine Performance', label: 'Engine', value: '1197 cc, 4 Cylinders Inline, 4 Valves/Cylinder, DOHC' },
  { section: 'Engine Performance', label: 'Max Power (bhp@rpm)', value: '89 bhp @ 6000 rpm' },
  { section: 'Engine Performance', label: 'Max Torque (Nm@rpm)', value: '113 Nm @ 4400 rpm' },
  { section: 'Engine Performance', label: 'Turbocharger/Supercharger', value: 'No' },
  { section: 'Engine Performance', label: 'Idle Start/Stop', value: 'Yes' },
  // Mileage & Fuel
  { section: 'Mileage & Fuel', label: 'ARAI', value: '21.79 kmpl' },
  { section: 'Mileage & Fuel', label: 'User Reported', value: '20 kmpl' },
  { section: 'Mileage & Fuel', label: 'Fuel Type', value: 'Petrol' },
  { section: 'Mileage & Fuel', label: 'Ethanol Compatibility', value: 'E20' },
  { section: 'Mileage & Fuel', label: 'Emission Standard', value: 'BS6 Phase 2' },
  // Battery & Range
  { section: 'Battery & Range', label: 'Driving Range', value: '806 km' },
  { section: 'Battery & Range', label: 'Pure Electric Driving Mode', value: 'No' },
  // Transmission & Drivetrain
  { section: 'Transmission & Drivetrain', label: 'Transmission', value: 'Manual - 5 Gears' },
  { section: 'Transmission & Drivetrain', label: 'Drivetrain', value: 'FWD' },
  { section: 'Transmission & Drivetrain', label: 'Differential Lock', value: 'No' },
  { section: 'Transmission & Drivetrain', label: 'Four-Wheel-Drive', value: 'No' },
  // Suspension
  { section: 'Suspension', label: 'Front Suspension', value: 'MacPherson Strut' },
  { section: 'Suspension', label: 'Rear Suspension', value: 'Torsion Beam' },
  // Capacity & Dimensions
  { section: 'Capacity & Dimensions', label: 'Length × Width × Height', value: '3995 mm × 1765 mm × 1550 mm' },
  { section: 'Capacity & Dimensions', label: 'Wheelbase', value: '2520 mm' },
  { section: 'Capacity & Dimensions', label: 'Seating Capacity', value: '5 Seats and 2 Rows' },
  { section: 'Capacity & Dimensions', label: 'Ground Clearance', value: '190 mm (unladen)' },
  { section: 'Capacity & Dimensions', label: 'Fuel Tank Capacity', value: '37 litres' },
  { section: 'Capacity & Dimensions', label: 'Doors', value: '5 Doors' },
  { section: 'Capacity & Dimensions', label: 'Minimum Turning Radius', value: '4.9 metres' },
  // Tyre & Wheels
  { section: 'Tyre & Wheels', label: 'Wheels', value: 'Steel Rims' },
  { section: 'Tyre & Wheels', label: 'Front Tyres', value: '195 / 60 R16' },
  { section: 'Tyre & Wheels', label: 'Rear Tyres', value: '195 / 60 R16' },
  { section: 'Tyre & Wheels', label: 'Spare Wheel & Tyre', value: 'Steel (195/60R16), Located in Boot' },
  { section: 'Tyre & Wheels', label: 'Tyres', value: 'Road Radial - Tubeless Tyres' },
  // Brakes
  { section: 'Brakes', label: 'Brake Type', value: 'Disc Brake (Front), Drum Brake (Rear)' },
  { section: 'Brakes', label: 'Anti-Lock Braking System (ABS)', value: 'Yes' },
  { section: 'Brakes', label: 'Brake Assist (BA)', value: 'Yes' },
  { section: 'Brakes', label: 'Electronic Brake-force Distribution (EBD)', value: 'Yes' },
  { section: 'Brakes', label: 'Electronic Stability Program (ESP)', value: 'Yes' },
  { section: 'Brakes', label: 'Traction Control System (TC/TCS)', value: 'Yes' },
  { section: 'Brakes', label: 'Hill Hold Control', value: 'Yes' },
  { section: 'Brakes', label: 'Hill Descent Control', value: 'Yes' },
  // Steering
  { section: 'Steering', label: 'Type', value: 'Power-assisted (Electric) Steering' },
  { section: 'Steering', label: 'Tilt Steering Adjustment', value: 'Yes' },
  { section: 'Steering', label: 'Steering-Mounted Controls', value: 'Yes' },
  // Passive Safety
  { section: 'Passive Safety', label: 'Airbags', value: '6 Airbags (Driver, Front Passenger, 2 Curtain, Driver Side, Front Passenger Side)' },
  { section: 'Passive Safety', label: 'NCAP Rating', value: '1 Star (ANCAP) Rating' },
  { section: 'Passive Safety', label: 'Headrest & Seatbelt', value: 'Rear Middle Head Rest & Rear Middle Three Point Seatbelt' },
  { section: 'Passive Safety', label: 'Child Safety', value: 'Child Seat Anchor Points, Child Safety Lock' },
  { section: 'Passive Safety', label: 'Engine Immobiliser', value: 'Yes' },
  { section: 'Passive Safety', label: 'Puncture Repair Kit', value: 'Yes' },
  { section: 'Passive Safety', label: 'Dashcam', value: 'Yes' },
  // ADAS & Active Safety
  { section: 'ADAS & Active Safety', label: 'Forward Collision Warning', value: 'Yes' },
  { section: 'ADAS & Active Safety', label: 'Automatic Emergency Braking (AEB)', value: 'Yes' },
  { section: 'ADAS & Active Safety', label: 'Lane Functions', value: 'Yes' },
  { section: 'ADAS & Active Safety', label: 'Blind Spot Detection', value: 'Yes' },
  { section: 'ADAS & Active Safety', label: 'High-beam Assist', value: 'Yes' },
  { section: 'ADAS & Active Safety', label: 'Tyre Pressure Monitoring System (TPMS)', value: 'Yes' },
  { section: 'ADAS & Active Safety', label: 'Emergency Brake Light Flashing', value: 'Yes' },
  // AC & Climate Control
  { section: 'AC & Climate Control', label: 'Air Conditioner', value: 'Automatic Climate Control, Single Zone Front-row AC zone' },
  { section: 'AC & Climate Control', label: 'Heater', value: 'Yes' },
  { section: 'AC & Climate Control', label: 'Air Purifier', value: 'Yes' },
  // Doors, Mirrors & Wipers
  { section: 'Doors, Mirrors & Wipers', label: 'Keyless Central Locking', value: 'Yes' },
  { section: 'Doors, Mirrors & Wipers', label: 'Speed Sensing Door Lock', value: 'Yes' },
  { section: 'Doors, Mirrors & Wipers', label: 'Black Interior Door Handles Finish', value: 'Yes' },
  { section: 'Doors, Mirrors & Wipers', label: 'Body Coloured Door Handles', value: 'Yes' },
  { section: 'Doors, Mirrors & Wipers', label: 'Cabin-Release Boot Opener', value: 'Yes' },
  { section: 'Doors, Mirrors & Wipers', label: 'Inside Mirror', value: 'Yes' },
  { section: 'Doors, Mirrors & Wipers', label: 'Co-Driver Sun Visor with Vanity Mirror', value: 'Yes' },
  { section: 'Doors, Mirrors & Wipers', label: 'ORVMs with Body-Coloured Finish', value: 'Yes' },
  { section: 'Doors, Mirrors & Wipers', label: 'Externally Adjustable ORVMs', value: 'Yes' },
  { section: 'Doors, Mirrors & Wipers', label: 'Anti-glare ORVMs', value: 'Yes' },
  { section: 'Doors, Mirrors & Wipers', label: 'Rear Defogger', value: 'Yes' },
  { section: 'Doors, Mirrors & Wipers', label: 'Rain-sensing Wipers', value: 'Yes' },
  { section: 'Doors, Mirrors & Wipers', label: 'Rear Wiper', value: 'Yes' },
  // Sunroof & Windows
  { section: 'Sunroof & Windows', label: 'Sunroof', value: 'Remote Sunroof: Open / Close via App' },
  { section: 'Sunroof & Windows', label: 'Power Windows', value: 'Front & Rear Power Windows, Driver One-touch up/down' },
  // Driver Assistance
  { section: 'Driver Assistance', label: 'Keyless Start/Button Start', value: 'Yes' },
  { section: 'Driver Assistance', label: 'Cruise Control', value: 'Yes' },
  { section: 'Driver Assistance', label: 'Electronic Parking Brake', value: 'Yes' },
  { section: 'Driver Assistance', label: 'Parking Sensors', value: 'Rear' },
  { section: 'Driver Assistance', label: 'Parking Assist', value: 'Yes' },
  // Storage
  { section: 'Storage', label: 'Bootspace', value: '308 L' },
  { section: 'Storage', label: 'Cupholders', value: 'Front Only' },
  { section: 'Storage', label: 'Door Pockets', value: 'Front & Rear Door Pockets' },
  { section: 'Storage', label: 'Cooled Glovebox', value: 'Yes' },
  { section: 'Storage', label: 'Front Seatback Pockets', value: 'Yes' },
  { section: 'Storage', label: 'Driver Armrest Storage', value: 'Yes' },
  { section: 'Storage', label: 'Sunglass Holder', value: 'Yes' },
  // Seating & Ergonomics
  { section: 'Seating & Ergonomics', label: 'Driver Seat Adjustment', value: '6 way manually adjustable' },
  { section: 'Seating & Ergonomics', label: 'Front Passenger Seat Adjustment', value: '6 way manually adjustable' },
  { section: 'Seating & Ergonomics', label: 'Second Row Seat Adjustment', value: '2 way manually adjustable' },
  { section: 'Seating & Ergonomics', label: 'Seat Upholstery', value: 'Fabric' },
  { section: 'Seating & Ergonomics', label: 'Front & Rear Headrests', value: 'Yes' },
  { section: 'Seating & Ergonomics', label: 'Split Rear Seat', value: '60:40 Split Rear Seat' },
  { section: 'Seating & Ergonomics', label: 'Flat Folding Rear Seat', value: 'Yes' },
  { section: 'Seating & Ergonomics', label: 'Rear Seat Type', value: 'Bench Seat Type' },
  { section: 'Seating & Ergonomics', label: 'Ventilated Seats', value: 'Yes' },
  { section: 'Seating & Ergonomics', label: 'Driver Armrest', value: 'Yes' },
  { section: 'Seating & Ergonomics', label: 'Rear Armrest', value: 'Yes' },
  // Infotainment & Entertainment
  { section: 'Infotainment & Entertainment', label: 'Infotainment Screen', value: 'Yes' },
  { section: 'Infotainment & Entertainment', label: 'Android Auto & Apple CarPlay', value: 'Yes' },
  { section: 'Infotainment & Entertainment', label: 'GPS Navigation System', value: 'Yes' },
  { section: 'Infotainment & Entertainment', label: 'Bluetooth Compatibility', value: 'Yes' },
  { section: 'Infotainment & Entertainment', label: 'Voice Command', value: 'Yes' },
  { section: 'Infotainment & Entertainment', label: 'Gesture Control', value: 'Yes' },
  { section: 'Infotainment & Entertainment', label: 'Roof-Mounted Antenna', value: 'Yes' },
  { section: 'Infotainment & Entertainment', label: 'Integrated Music System', value: 'Integrated (in-dash) Music System' },
  { section: 'Infotainment & Entertainment', label: '12V Power Outlet', value: 'Yes' },
  { section: 'Infotainment & Entertainment', label: 'Wireless Charger', value: 'Yes' },
  // Instrument Cluster
  { section: 'Instrument Cluster', label: 'Display', value: 'Analogue - Digital Instrument Cluster' },
  { section: 'Instrument Cluster', label: 'Analogue Tachometer', value: 'Yes' },
  { section: 'Instrument Cluster', label: 'Gear Indicator', value: 'Yes' },
  { section: 'Instrument Cluster', label: 'Heads Up Display (HUD)', value: 'Yes' },
  { section: 'Instrument Cluster', label: 'Shift Indicator', value: 'Yes' },
  { section: 'Instrument Cluster', label: 'Trip Meter', value: 'Trip Meter with 2 Trips (Electronic)' },
  { section: 'Instrument Cluster', label: 'Digital Clock', value: 'Yes' },
  { section: 'Instrument Cluster', label: 'Fuel Consumption Data', value: 'Average fuel consumption, Distance to empty' },
  { section: 'Instrument Cluster', label: 'Average Speed', value: 'No' },
  // Lighting & Visibility
  { section: 'Lighting & Visibility', label: 'Headlamp', value: 'Halogen Projector Headlights' },
  { section: 'Lighting & Visibility', label: 'Headlight Height Adjuster', value: 'Yes' },
  { section: 'Lighting & Visibility', label: 'Daytime Running Lights', value: 'Yes' },
  { section: 'Lighting & Visibility', label: 'Cornering Headlights', value: 'Yes' },
  { section: 'Lighting & Visibility', label: 'Fog Lights', value: 'Yes' },
  { section: 'Lighting & Visibility', label: 'Follow Me Home Headlamps', value: 'Yes' },
  { section: 'Lighting & Visibility', label: 'Automatic Headlamps', value: 'Yes' },
  { section: 'Lighting & Visibility', label: 'Puddle Lamps', value: 'Yes' },
  { section: 'Lighting & Visibility', label: 'Taillights', value: 'LED Taillights' },
  { section: 'Lighting & Visibility', label: 'Cabin Lights', value: 'Cabin Lamp (Centre) & Reading Lamp' },
  { section: 'Lighting & Visibility', label: 'Ambient Interior Lighting', value: 'Yes' },
  // Mobile App & Remote Controls
  { section: 'Mobile App & Remote Controls', label: 'Find My Car', value: 'Yes' },
  { section: 'Mobile App & Remote Controls', label: 'Geo-fence', value: 'Yes' },
  { section: 'Mobile App & Remote Controls', label: 'Check Vehicle Status via App', value: 'No' },
  { section: 'Mobile App & Remote Controls', label: 'Alexa Compatibility', value: 'Yes' },
  { section: 'Mobile App & Remote Controls', label: 'In-Car Payment', value: 'Yes' },
  { section: 'Mobile App & Remote Controls', label: 'Emergency Call Button', value: 'No' },
  { section: 'Mobile App & Remote Controls', label: 'Over The Air (OTA) Updates', value: 'Yes' },
  { section: 'Mobile App & Remote Controls', label: 'Remote AC', value: 'On / Off via App' },
  { section: 'Mobile App & Remote Controls', label: 'Remote Car Lock/Unlock', value: 'via App' },
  { section: 'Mobile App & Remote Controls', label: 'Remote Sunroof', value: 'Open / Close via App' },
  { section: 'Mobile App & Remote Controls', label: 'Car Light Flashing & Honking', value: 'via App' },
  // Design & Styling
  { section: 'Design & Styling', label: 'Roof Rails', value: 'Yes' },
  { section: 'Design & Styling', label: 'Chrome Finish Exhaust', value: 'Yes' },
  { section: 'Design & Styling', label: 'Body-coloured Bumpers', value: 'Yes' },
  { section: 'Design & Styling', label: 'Interior', value: 'Dual Tone Interiors' },
  // Warning & Alerts
  { section: 'Warning & Alerts', label: 'Overspeed Warning', value: '1 beep over 80kmph' },
  { section: 'Warning & Alerts', label: 'Door Ajar Warning', value: 'Yes' },
  { section: 'Warning & Alerts', label: 'Seat Belt Warning', value: 'Yes' },
  { section: 'Warning & Alerts', label: 'Headlight and Ignition on Reminder', value: 'Yes' },
  { section: 'Warning & Alerts', label: 'Auto Crash Alert', value: 'Yes' },
];

const matched: any[] = [];
const unmapped: any[] = [];

for (const row of ROWS) {
  if (isInvalidLabel(row.label)) continue;
  const normalized = normalizeLabel(row.label);
  const mapping = getSpecMapping(row.label);
  if (mapping) {
    matched.push({ ...row, normalized, mappedKey: mapping.key, category: mapping.category, path: mapping.path || mapping.rootKey });
  } else {
    unmapped.push({ ...row, normalized });
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('  CARWALE — MARUTI FRONX SIGMA — MATCH RATE');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Total rows fed:        ${ROWS.length}`);
console.log(`Matched (canonical):   ${matched.length}`);
console.log(`Unmapped:              ${unmapped.length}`);
console.log(`Match rate:            ${((matched.length / ROWS.length) * 100).toFixed(1)}%`);
console.log('───────────────────────────────────────────────────────────────');

// Per-section breakdown
const sectionTotals: Record<string, { matched: number; total: number }> = {};
for (const r of ROWS) {
  sectionTotals[r.section] = sectionTotals[r.section] || { matched: 0, total: 0 };
  sectionTotals[r.section].total++;
}
for (const m of matched) {
  sectionTotals[m.section].matched++;
}
console.log('Match rate by section:');
for (const [section, t] of Object.entries(sectionTotals)) {
  const pct = ((t.matched / t.total) * 100).toFixed(0);
  const bar = pct === '100' ? '✓' : pct === '0' ? '✗' : '~';
  console.log(`  ${bar} ${section.padEnd(35)} ${String(t.matched).padStart(2)}/${String(t.total).padStart(2)}  (${pct.padStart(3)}%)`);
}

if (unmapped.length > 0) {
  console.log('───────────────────────────────────────────────────────────────');
  console.log('UNMAPPED LABELS — Carwale-specific vocabulary to add to map:');
  for (const u of unmapped) {
    console.log(`  [${u.section}]`);
    console.log(`    label:      "${u.label}"`);
    console.log(`    normalized: "${u.normalized}"`);
    console.log(`    value:      ${JSON.stringify(u.value)}`);
  }
}
