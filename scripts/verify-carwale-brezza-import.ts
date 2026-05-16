/**
 * Regression fixture: CarWale Maruti Brezza LXi variant page.
 * Runs the CarWaleExtractor against a live page and validates spec count + key fields.
 * Usage: npx ts-node scripts/verify-carwale-brezza-import.ts
 */
import { CarWaleExtractor } from '../src/modules/imports/extractors/carwale.extractor';
import {
  getSpecMapping,
  isInvalidLabel,
  normalizeLabel,
} from '../src/modules/variants/utils/spec-key-map';

const CAR_URL = 'https://www.carwale.com/maruti-suzuki-cars/brezza/';
const VARIANT_URL = 'https://www.carwale.com/maruti-suzuki-cars/brezza/lxi/';

async function run() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  CARWALE — MARUTI BREZZA — LIVE EXTRACTOR VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════');

  // ── Car page ──────────────────────────────────────────────────────────────
  console.log('\n[1] Extracting car overview...');
  const car = await CarWaleExtractor.extractCarData(CAR_URL);
  console.log(`  name:       ${car.name}`);
  console.log(`  brand:      ${car.brand}`);
  console.log(`  slug:       ${car.slug}`);
  console.log(`  body_type:  ${car.body_type}`);
  console.log(`  fuel_type:  ${car.fuel_type}`);
  console.log(`  price:      ${car.price_range_text}`);
  console.log(`  min_price:  ${car.min_price?.toLocaleString('en-IN')}`);
  console.log(`  max_price:  ${car.max_price?.toLocaleString('en-IN')}`);

  // ── Variant page ──────────────────────────────────────────────────────────
  console.log('\n[2] Extracting variant specs...');
  const variant = await CarWaleExtractor.extractVariantData(VARIANT_URL);
  console.log(`  variant_name: ${variant.variant_name}`);
  console.log(`  full_name:    ${variant.full_name}`);
  console.log(`  price:        ₹${variant.price?.toLocaleString('en-IN')} (${variant.price_text})`);
  console.log(`  fuel_type:    ${variant.fuel_type}`);
  console.log(`  transmission: ${variant.transmission}`);
  console.log(`  specs count:  ${variant.specs.length}`);

  // ── SPEC_LABEL_MAP match rate ─────────────────────────────────────────────
  console.log('\n[3] SPEC_LABEL_MAP match rate...');
  const matched: typeof variant.specs = [];
  const unmapped: typeof variant.specs = [];

  for (const row of variant.specs) {
    if (isInvalidLabel(row.label)) continue;
    const mapping = getSpecMapping(row.label);
    if (mapping) matched.push(row);
    else unmapped.push(row);
  }

  const total = matched.length + unmapped.length;
  console.log(`  Matched:   ${matched.length}/${total}  (${((matched.length / total) * 100).toFixed(1)}%)`);

  if (unmapped.length > 0) {
    console.log('\n  UNMAPPED labels (add aliases to SPEC_LABEL_MAP):');
    for (const u of unmapped) {
      console.log(`    [${u.section}] "${u.label}" → "${u.value}"`);
      console.log(`      normalized: "${normalizeLabel(u.label)}"`);
    }
  }

  console.log('\n  Matched spec paths:');
  for (const m of matched) {
    const map = getSpecMapping(m.label)!;
    console.log(`    ✓ ${m.label.padEnd(45)} → ${(map.path || map.rootKey || map.key)}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
}

run().catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
