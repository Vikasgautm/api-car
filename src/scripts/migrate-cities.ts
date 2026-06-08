/**
 * City migration script — reads local JSON file, writes to any MongoDB URI.
 *
 * Usage:
 *   npx ts-node src/scripts/migrate-cities.ts --uri "mongodb+srv://user:pass@host/db"
 *   npx ts-node src/scripts/migrate-cities.ts --uri "mongodb+srv://..." --file "path/to/cities.json"
 *
 * Flags:
 *   --uri   <string>  Target MongoDB connection string (required)
 *   --file  <string>  Path to the JSON export (optional — defaults to city data/ in project root)
 *   --dry             Dry run: parse + validate only, do not write to DB
 */

import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';

const BATCH_SIZE = 1000;

// ── CLI arg parsing ──────────────────────────────────────────────────────────

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const TARGET_URI = getArg('--uri');
const FILE_ARG   = getArg('--file');
const DRY_RUN    = process.argv.includes('--dry');

if (!TARGET_URI && !DRY_RUN) {
  console.error('❌  --uri is required.\n');
  console.error('  Usage: npx ts-node src/scripts/migrate-cities.ts --uri "mongodb+srv://..." [--file path] [--dry]');
  process.exit(1);
}

// ── Types ────────────────────────────────────────────────────────────────────

interface RawCity {
  _id?: { $oid: string } | string;
  city_id: string;
  name: string;
  slug: string;
  state: string;
  country?: string;
  pincode?: string | number;
  longitude?: number;
  latitude?: number;
  is_published?: boolean;
  is_featured?: boolean;
  noindex?: boolean;
  is_deleted?: boolean;
  deleted_at?: { $date: string } | string | null;
  createdAt?: { $date: string } | string;
  updatedAt?: { $date: string } | string;
  __v?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveDate(v: { $date: string } | string | undefined | null): Date | undefined {
  if (!v) return undefined;
  const raw = typeof v === 'object' ? v.$date : v;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? undefined : d;
}

function normalize(c: RawCity) {
  return {
    city_id:      c.city_id,
    name:         c.name,
    slug:         c.slug,
    state:        c.state,
    country:      c.country ?? 'India',
    pincode:      c.pincode != null ? String(c.pincode) : undefined,
    longitude:    c.longitude,
    latitude:     c.latitude,
    is_published: c.is_published ?? false,
    is_featured:  c.is_featured ?? false,
    noindex:      c.noindex ?? false,
    is_deleted:   c.is_deleted ?? false,
    deleted_at:   resolveDate(c.deleted_at as { $date: string } | string | undefined),
    createdAt:    resolveDate(c.createdAt as { $date: string } | string | undefined),
    updatedAt:    resolveDate(c.updatedAt as { $date: string } | string | undefined),
  };
}

function maskUri(uri: string): string {
  // Hide password in logs: mongodb+srv://user:PASS@host → mongodb+srv://user:***@host
  return uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
}

// ── City schema (inline so this script has no dependency on compiled app) ────

import { Schema, model, Document } from 'mongoose';

interface ICity extends Document {
  city_id: string; name: string; slug: string; state: string;
  country?: string; pincode?: string; longitude?: number; latitude?: number;
  is_published?: boolean; is_featured?: boolean; noindex?: boolean;
  is_deleted?: boolean; deleted_at?: Date;
}

const citySchema = new Schema<ICity>(
  {
    city_id:      { type: String, required: true, unique: true },
    name:         { type: String, required: true },
    slug:         { type: String, required: true, unique: true },
    state:        { type: String, required: true },
    country:      { type: String, default: 'India' },
    pincode:      { type: String },
    longitude:    { type: Number },
    latitude:     { type: Number },
    is_published: { type: Boolean, default: false },
    is_featured:  { type: Boolean, default: false },
    noindex:      { type: Boolean, default: false },
    is_deleted:   { type: Boolean, default: false },
    deleted_at:   { type: Date },
  },
  { timestamps: true }
);

const City = model<ICity>('City', citySchema);

// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  // 1. Locate JSON file
  const jsonPath = FILE_ARG
    ? path.resolve(FILE_ARG)
    : path.resolve(__dirname, '../../prod_carsalahakar-updated.cities.json');

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌  JSON file not found: ${jsonPath}`);
    console.error('    Pass --file <path> to specify a custom location.');
    process.exit(1);
  }

  // 2. Parse
  console.log(`\n📂  Source : ${jsonPath}`);
  const raw: RawCity[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const docs = raw.map(normalize);
  console.log(`📊  Records: ${docs.length}`);

  // Validate: catch missing required fields before touching DB
  const invalid = docs.filter(d => !d.city_id || !d.name || !d.slug || !d.state);
  if (invalid.length) {
    console.error(`❌  ${invalid.length} records are missing required fields (city_id / name / slug / state)`);
    console.error('    First offender:', JSON.stringify(invalid[0], null, 2));
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('\n✅  Dry run — validation passed. No data written.');
    console.log(`    Sample record:\n${JSON.stringify(docs[0], null, 2)}`);
    return;
  }

  // 3. Connect to target
  console.log(`\n🎯  Target : ${maskUri(TARGET_URI!)}`);
  console.log('🔌  Connecting…');
  await mongoose.connect(TARGET_URI!);
  console.log('✅  Connected\n');

  // 4. Check existing count
  const existingCount = await City.countDocuments();
  console.log(`ℹ️   Existing cities in target DB: ${existingCount}`);

  // 5. Batch upsert
  let inserted = 0;
  let skipped  = 0;
  let errors   = 0;
  const totalBatches = Math.ceil(docs.length / BATCH_SIZE);

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch    = docs.slice(i, i + BATCH_SIZE);

    process.stdout.write(`   Batch ${batchNum}/${totalBatches} (${batch.length} docs)… `);

    try {
      const ops = batch.map(doc => ({
        updateOne: {
          filter: { city_id: doc.city_id },
          update: { $setOnInsert: doc },
          upsert: true,
        },
      }));

      const result = await City.bulkWrite(ops, { ordered: false });
      inserted += result.upsertedCount;
      skipped  += batch.length - result.upsertedCount;
      console.log(`inserted=${result.upsertedCount}  skipped=${batch.length - result.upsertedCount}`);
    } catch (err: unknown) {
      errors++;
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`ERROR — ${msg}`);
    }
  }

  // 6. Summary
  console.log('\n' + '─'.repeat(48));
  console.log('✅  Migration complete');
  console.log(`   Inserted : ${inserted}`);
  console.log(`   Skipped  : ${skipped}  (already existed)`);
  console.log(`   Errors   : ${errors} batch(es)`);
  console.log('─'.repeat(48) + '\n');

  await mongoose.disconnect();
  process.exit(errors > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
