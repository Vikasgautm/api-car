import fs from 'fs';
import path from 'path';
import { City } from '../models/city.model';
import { logger } from '../utils/logger';

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

const BATCH_SIZE = 1000;

function resolveDate(v: { $date: string } | string | undefined | null): Date | undefined {
  if (!v) return undefined;
  const raw = typeof v === 'object' ? v.$date : v;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? undefined : d;
}

function normalize(c: RawCity) {
  return {
    city_id: c.city_id,
    name: c.name,
    slug: c.slug,
    state: c.state,
    country: c.country ?? 'India',
    pincode: c.pincode != null ? String(c.pincode) : undefined,
    longitude: c.longitude,
    latitude: c.latitude,
    is_published: c.is_published ?? false,
    is_featured: c.is_featured ?? false,
    noindex: c.noindex ?? false,
    is_deleted: c.is_deleted ?? false,
    deleted_at: resolveDate(c.deleted_at as { $date: string } | string | undefined),
    createdAt: resolveDate(c.createdAt as { $date: string } | string | undefined),
    updatedAt: resolveDate(c.updatedAt as { $date: string } | string | undefined),
  };
}

// JSON file lives at <project-root>/city data/ — one level above api-car/
const JSON_PATH = path.resolve(__dirname, '../../../city data/prod_carsalahakar-updated.cities.json');

export const seedCities = async () => {
  try {
    if (!fs.existsSync(JSON_PATH)) {
      logger.warn(`City seed: JSON file not found at ${JSON_PATH} — skipping`);
      return;
    }

    const rawCities: RawCity[] = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
    const total = rawCities.length;

    const existingCount = await City.countDocuments();
    if (existingCount >= total) {
      logger.info(`City seed: ${existingCount} cities already in DB — skipping`);
      return;
    }

    logger.info(`City seed: found ${total} records in JSON, ${existingCount} in DB — upserting…`);

    let inserted = 0;
    let skipped = 0;
    const totalBatches = Math.ceil(total / BATCH_SIZE);

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const docs = rawCities.slice(i, i + BATCH_SIZE).map(normalize);

      const ops = docs.map((doc) => ({
        updateOne: {
          filter: { city_id: doc.city_id },
          update: { $setOnInsert: doc },
          upsert: true,
        },
      }));

      const result = await City.bulkWrite(ops, { ordered: false });
      inserted += result.upsertedCount;
      skipped += docs.length - result.upsertedCount;

      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      logger.info(`City seed: batch ${batchNum}/${totalBatches} — inserted=${result.upsertedCount}`);
    }

    logger.info(`City seed complete — inserted: ${inserted}, skipped: ${skipped}`);
  } catch (error: any) {
    logger.error('City seed error:', error);
  }
};
