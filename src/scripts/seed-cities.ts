/**
 * Seed script: uploads city data from a JSON export to MongoDB in batches of 1000.
 *
 * Usage:
 *   npx ts-node src/scripts/seed-cities.ts [path/to/cities.json]
 *
 * The JSON file must be a MongoDB extended JSON export (array of city objects).
 * Duplicate city_id / slug values are skipped (upsert by city_id).
 *
 * Environment:
 *   MONGODB_URI  — connection string (falls back to config default)
 */

import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { config } from '../config';
import { City } from '../models/city.model';

const BATCH_SIZE = 1000;

// MongoDB extended-JSON uses { "$oid": "..." } and { "$date": "..." }
interface RawCity {
  _id?: { $oid: string } | string;
  city_id: string;
  name: string;
  slug: string;
  state: string;
  country?: string;
  pincode?: string;
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

function resolveDate(v: { $date: string } | string | undefined | null): Date | undefined {
  if (!v) return undefined;
  const raw = typeof v === 'object' ? v.$date : v;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? undefined : d;
}

function normalizeRecord(raw: RawCity) {
  return {
    city_id: raw.city_id,
    name: raw.name,
    slug: raw.slug,
    state: raw.state,
    country: raw.country ?? 'India',
    pincode: raw.pincode != null ? String(raw.pincode) : undefined,
    longitude: raw.longitude,
    latitude: raw.latitude,
    is_published: raw.is_published ?? false,
    is_featured: raw.is_featured ?? false,
    noindex: raw.noindex ?? false,
    is_deleted: raw.is_deleted ?? false,
    deleted_at: resolveDate(raw.deleted_at as { $date: string } | string | undefined),
    createdAt: resolveDate(raw.createdAt as { $date: string } | string | undefined),
    updatedAt: resolveDate(raw.updatedAt as { $date: string } | string | undefined),
  };
}

async function run() {
  const jsonPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(__dirname, '../../../city data/prod_carsalahakar-updated.cities.json');

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌  File not found: ${jsonPath}`);
    process.exit(1);
  }

  console.log(`📂  Reading: ${jsonPath}`);
  const raw: RawCity[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`📊  Total records: ${raw.length}`);

  console.log(`🔌  Connecting to MongoDB…`);
  await mongoose.connect(config.mongodb_uri as string);
  console.log(`✅  Connected\n`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const totalBatches = Math.ceil(raw.length / BATCH_SIZE);

  for (let i = 0; i < raw.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const chunk = raw.slice(i, i + BATCH_SIZE);
    const docs = chunk.map(normalizeRecord);

    process.stdout.write(`   Batch ${batchNum}/${totalBatches} (${docs.length} records)… `);

    try {
      // Upsert each doc by city_id so re-runs are idempotent
      const ops = docs.map((doc) => ({
        updateOne: {
          filter: { city_id: doc.city_id },
          update: { $setOnInsert: doc },
          upsert: true,
        },
      }));

      const result = await City.bulkWrite(ops, { ordered: false });
      const batchInserted = result.upsertedCount;
      const batchSkipped = docs.length - batchInserted;
      inserted += batchInserted;
      skipped += batchSkipped;
      console.log(`inserted=${batchInserted}, skipped=${batchSkipped}`);
    } catch (err: unknown) {
      errors++;
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`ERROR — ${msg}`);
    }
  }

  console.log('\n────────────────────────────────');
  console.log(`✅  Done`);
  console.log(`   Inserted : ${inserted}`);
  console.log(`   Skipped  : ${skipped} (already existed)`);
  console.log(`   Errors   : ${errors} batches`);
  console.log('────────────────────────────────');

  await mongoose.disconnect();
  process.exit(errors > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
