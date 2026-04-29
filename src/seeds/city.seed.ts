import fs from 'fs';
import path from 'path';
import { City } from '../models/city.model';
import { logger } from '../utils/logger';

interface RawCity {
  _id?: { $oid: string };
  city_uuid: string;
  city_name: string;
  slug: string;
  state: string;
  longitude?: number;
  pincode?: number;
  latitude?: number;
  city_logo?: string | null;
  is_deleted?: boolean;
  createdAt?: { $date: string };
  updatedAt?: { $date: string };
  __v?: number;
}

const BATCH_SIZE = 500;

export const seedCities = async () => {
  try {
    const filePath = path.resolve(__dirname, 'prod_carsalahakar.cities.json');

    if (!fs.existsSync(filePath)) {
      logger.error(`City data file not found at: ${filePath}`);
      return;
    }

    logger.info('Reading city data file...');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const rawCities: RawCity[] = JSON.parse(raw);

    logger.info(`Found ${rawCities.length} cities in JSON file`);

    // Check if cities already exist
    const existingCount = await City.countDocuments();
    if (existingCount > 0) {
      logger.info(`Cities already exist in database (${existingCount} found). Skipping seed.`);
      return;
    }

    // Map raw data to model shape
    const mappedCities = rawCities.map((c) => ({
      city_id: c.city_uuid,
      name: c.city_name,
      slug: c.slug,
      state: c.state,
      country: 'India',
      pincode: c.pincode ?? undefined,
      longitude: c.longitude,
      latitude: c.latitude,
    }));

    // Insert in batches
    let inserted = 0;
    for (let i = 0; i < mappedCities.length; i += BATCH_SIZE) {
      const batch = mappedCities.slice(i, i + BATCH_SIZE);
      await City.insertMany(batch, { ordered: false });
      inserted += batch.length;
      logger.info(`Inserted ${inserted}/${mappedCities.length} cities`);
    }

    logger.info(`City seed completed. Total inserted: ${inserted}`);
  } catch (error: any) {
    if (error.writeErrors) {
      // Partial success with ordered:false — some duplicates may exist
      logger.warn(`City seed completed with ${error.writeErrors.length} write errors (likely duplicates)`);
      logger.info(`Successfully inserted: ${error.insertedCount ?? 'unknown'}`);
    } else {
      logger.error('Error seeding cities:', error);
    }
  }
};
