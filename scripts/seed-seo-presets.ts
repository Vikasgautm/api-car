/**
 * Seed the standard buyer-intent SEO landing pages.
 *
 * Each preset is a saved DiscoveryService query: when the public site loads
 * /cars/<slug>, the SeoPreset hydrates its `query_params` into DiscoveryFilters,
 * runs the discovery query, and renders the result. Because the discovery query
 * runs live against Car/CarVariant on every request, these pages auto-refresh
 * the moment variant aggregates change — no background job, no cache busting.
 *
 * Idempotent: if a preset with the same slug already exists, it is left alone
 * (so editors can tweak titles/copy without the seed clobbering their work).
 *
 * Run: npx ts-node scripts/seed-seo-presets.ts
 */
import mongoose from 'mongoose';
import { SeoPreset } from '../src/models/seo-preset.model';
import { v4 as uuidv4 } from 'uuid';

interface PresetDef {
  slug: string;
  title: string;
  h1: string;
  meta_description: string;
  meta_keywords: string;
  hero_intro: string;
  query_params: Record<string, string>;
  sort_order: number;
}

// Standard buyer-intent SEO landing pages. Each query_params shape matches
// DiscoveryFilters — boolean values are serialized as strings since they
// originate as query-string parameters in production.
const PRESETS: PresetDef[] = [
  // ── Feature availability ──
  {
    slug: 'cars-with-sunroof',
    title: 'Cars with Sunroof in India',
    h1: 'Cars with Sunroof',
    meta_description: 'Explore all cars in India with a sunroof — single-pane or panoramic. Compare prices, features, and variants.',
    meta_keywords: 'cars with sunroof, sunroof cars india, panoramic sunroof cars',
    hero_intro: 'Looking for that open-air feel? Browse every car on sale in India that offers a sunroof — from compact hatchbacks to flagship SUVs.',
    query_params: { has_sunroof: 'true' },
    sort_order: 10,
  },
  {
    slug: 'cars-with-panoramic-sunroof',
    title: 'Cars with Panoramic Sunroof in India',
    h1: 'Cars with Panoramic Sunroof',
    meta_description: 'Panoramic sunroof cars in India — full-length glass roofs across the SUV and premium sedan segments.',
    meta_keywords: 'panoramic sunroof cars, cars with big sunroof',
    hero_intro: 'A panoramic sunroof transforms cabin feel. Here are every car in India that ships one in at least one variant.',
    query_params: { has_panoramic_sunroof: 'true' },
    sort_order: 11,
  },
  {
    slug: 'cars-with-adas',
    title: 'ADAS Cars in India',
    h1: 'Cars with ADAS',
    meta_description: 'Cars with Advanced Driver Assistance Systems (ADAS) in India — adaptive cruise, lane keep assist, AEB, and more.',
    meta_keywords: 'ADAS cars india, adaptive cruise control cars, lane keep assist',
    hero_intro: 'ADAS Level-2 features are now available across price points. Find every car in India that ships ADAS in at least one variant.',
    query_params: { has_adas: 'true' },
    sort_order: 20,
  },
  {
    slug: 'cars-with-360-camera',
    title: 'Cars with 360° Camera in India',
    h1: 'Cars with 360-Degree Camera',
    meta_description: 'Cars with 360-degree surround-view cameras in India for easier parking and better safety.',
    meta_keywords: '360 camera cars, surround view cars, parking camera cars',
    hero_intro: 'A 360° camera makes city parking effortless. Here every car in India that offers it.',
    query_params: { has_camera_360: 'true' },
    sort_order: 21,
  },
  {
    slug: 'cars-with-ventilated-seats',
    title: 'Cars with Ventilated Seats in India',
    h1: 'Cars with Ventilated Seats',
    meta_description: 'Ventilated front seats — the comfort feature that transforms summer drives. Every car in India that offers them.',
    meta_keywords: 'ventilated seats cars, cooled seats cars',
    hero_intro: 'Ventilated seats are no longer just a luxury feature. Browse every car in India that ships them.',
    query_params: { has_ventilated_seats: 'true' },
    sort_order: 22,
  },
  {
    slug: 'connected-cars',
    title: 'Connected Cars in India',
    h1: 'Connected Cars',
    meta_description: 'Cars with connected-car features — remote start, geo-fence, vehicle tracking, app control. The full Indian list.',
    meta_keywords: 'connected cars india, connected car app, remote start cars',
    hero_intro: 'Connected car tech is now table-stakes above ₹10L. Find every car in India with a connected-car app.',
    query_params: { has_connected_car: 'true' },
    sort_order: 23,
  },
  // ── AI intelligence (rule + LLM derived) ──
  {
    slug: 'family-friendly-cars',
    title: 'Family-Friendly Cars in India',
    h1: 'Family-Friendly Cars',
    meta_description: 'Cars built for Indian families — 6+ seats or strong safety+ISOFIX+rear AC combinations.',
    meta_keywords: 'family cars india, 7 seater family cars, safe family cars',
    hero_intro: 'A family car needs space, safety, and rear-seat comfort. We rank every car on these specific signals.',
    query_params: { family_friendly: 'true' },
    sort_order: 30,
  },
  {
    slug: 'city-friendly-cars',
    title: 'City-Friendly Cars in India',
    h1: 'City-Friendly Cars',
    meta_description: 'Compact, fuel-efficient cars built for Indian city traffic — hatchbacks, sub-4m sedans, and efficient compact SUVs.',
    meta_keywords: 'city cars india, compact cars, fuel efficient cars',
    hero_intro: 'Dense traffic, tight parking, expensive fuel. Here every car that handles Indian city life well.',
    query_params: { city_friendly: 'true' },
    sort_order: 31,
  },
  {
    slug: 'highway-friendly-cars',
    title: 'Highway-Friendly Cars in India',
    h1: 'Highway-Friendly Cars',
    meta_description: 'Cars with the power, torque, and high-speed comfort for Indian expressways and long-distance touring.',
    meta_keywords: 'highway cars india, long distance cars, touring cars',
    hero_intro: 'Sustained 100+ kmph touring needs power, torque, and stability. We rank every car on those specific signals.',
    query_params: { highway_friendly: 'true' },
    sort_order: 32,
  },
  {
    slug: 'offroad-ready-cars',
    title: 'Offroad-Ready SUVs in India',
    h1: 'Offroad-Ready Cars',
    meta_description: 'SUVs and 4x4 crossovers built for India’s broken roads, mild trails, and water-crossing routes.',
    meta_keywords: 'offroad SUVs india, 4x4 cars, AWD cars india',
    hero_intro: 'Offroad-ready means tall ground clearance plus AWD/4WD — not just SUV looks. Browse every car that delivers both.',
    query_params: { offroad_ready: 'true' },
    sort_order: 33,
  },
  {
    slug: 'feature-loaded-cars',
    title: 'Feature-Loaded Cars in India',
    h1: 'Feature-Loaded Cars',
    meta_description: 'Cars packed with premium features — sunroof, ventilated seats, ADAS, 360° camera, connected app, and more.',
    meta_keywords: 'feature loaded cars, fully loaded cars india',
    hero_intro: 'Want every premium feature available at your price point? Here’s the full list of feature-loaded cars in India.',
    query_params: { feature_loaded: 'true' },
    sort_order: 34,
  },
  {
    slug: 'premium-cabin-cars',
    title: 'Cars with Premium Cabins in India',
    h1: 'Premium Cabin Cars',
    meta_description: 'Cars with luxury cabin materials — leather, ambient lighting, soft-touch dashboard, and premium finishes.',
    meta_keywords: 'premium cabin cars, luxury interior cars',
    hero_intro: 'Cabin feel matters more than ever. These cars deliver genuinely premium materials inside.',
    query_params: { premium_cabin: 'true' },
    sort_order: 35,
  },
  {
    slug: 'budget-friendly-cars',
    title: 'Budget-Friendly Cars Under ₹8 Lakh',
    h1: 'Budget-Friendly Cars',
    meta_description: 'Cars priced under ₹8 lakh ex-showroom in India — the most affordable new cars on sale.',
    meta_keywords: 'cars under 8 lakh, budget cars india, affordable cars',
    hero_intro: 'Affordable doesn’t mean compromised. Here every car in India that starts under ₹8 lakh.',
    query_params: { budget_friendly: 'true' },
    sort_order: 36,
  },
  {
    slug: 'performance-focused-cars',
    title: 'Performance Cars in India',
    h1: 'Performance-Focused Cars',
    meta_description: 'Cars built for driving enthusiasts — 0-100 under 9s, 200+ bhp, sport drive modes, and paddle shifters.',
    meta_keywords: 'performance cars india, fast cars india, sports cars india',
    hero_intro: 'Driving enthusiasts only. These cars deliver real performance, not just a sporty badge.',
    query_params: { performance_focused: 'true' },
    sort_order: 37,
  },
  // ── Powertrain ──
  {
    slug: 'awd-4wd-cars',
    title: 'AWD and 4WD Cars in India',
    h1: 'Cars with AWD / 4WD',
    meta_description: 'All-wheel-drive and four-wheel-drive cars in India — the full list across SUVs and performance models.',
    meta_keywords: 'AWD cars india, 4WD cars india, all wheel drive',
    hero_intro: 'AWD/4WD goes beyond off-roading — it’s also a safety and traction story in wet conditions. Here’s the full list.',
    query_params: { drive_types: 'AWD,4WD' },
    sort_order: 40,
  },
  // ── Safety ──
  {
    slug: 'safest-cars-5-star-ncap',
    title: '5-Star NCAP Cars in India',
    h1: '5-Star NCAP Safety Cars',
    meta_description: 'Cars with a 5-star Global NCAP or Bharat NCAP rating in India — the safest cars on sale.',
    meta_keywords: '5 star NCAP cars, safest cars india, BNCAP 5 star cars',
    hero_intro: 'A 5-star NCAP rating is the strongest single signal of crash safety. Here every car in India that has earned one.',
    query_params: { min_ncap_rating: '5' },
    sort_order: 50,
  },
];

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('Missing MONGODB_URI / MONGO_URI env var');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(`Connected. Seeding ${PRESETS.length} SEO presets...`);

  let created = 0;
  let skipped = 0;
  let failed = 0;
  const failures: Array<{ slug: string; error: string }> = [];

  for (const def of PRESETS) {
    try {
      const existing = await SeoPreset.findOne({ slug: def.slug }).lean();
      if (existing) {
        skipped++;
        continue;
      }
      await SeoPreset.create({
        preset_id: uuidv4(),
        slug: def.slug,
        title: def.title,
        h1: def.h1,
        meta_description: def.meta_description,
        meta_keywords: def.meta_keywords,
        hero_intro: def.hero_intro,
        query_params: def.query_params,
        is_published: true,
        is_deleted: false,
        sort_order: def.sort_order,
      });
      created++;
    } catch (err: any) {
      failed++;
      failures.push({ slug: def.slug, error: err?.message ?? String(err) });
    }
  }

  console.log('\n── Seed complete ──');
  console.log(`Created: ${created}`);
  console.log(`Skipped (already existed): ${skipped}`);
  console.log(`Failed:  ${failed}`);

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f.slug}: ${f.error}`);
  }

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
