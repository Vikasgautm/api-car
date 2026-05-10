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

const DEFAULT_CITIES = [
  { city_id: 'delhi-001', name: 'New Delhi', slug: 'new-delhi', state: 'Delhi', country: 'India', pincode: 110001, latitude: 28.6139, longitude: 77.2090 },
  { city_id: 'mumbai-001', name: 'Mumbai', slug: 'mumbai', state: 'Maharashtra', country: 'India', pincode: 400001, latitude: 19.0760, longitude: 72.8777 },
  { city_id: 'bangalore-001', name: 'Bangalore', slug: 'bangalore', state: 'Karnataka', country: 'India', pincode: 560001, latitude: 12.9716, longitude: 77.5946 },
  { city_id: 'chennai-001', name: 'Chennai', slug: 'chennai', state: 'Tamil Nadu', country: 'India', pincode: 600001, latitude: 13.0827, longitude: 80.2707 },
  { city_id: 'hyderabad-001', name: 'Hyderabad', slug: 'hyderabad', state: 'Telangana', country: 'India', pincode: 500001, latitude: 17.3850, longitude: 78.4867 },
  { city_id: 'pune-001', name: 'Pune', slug: 'pune', state: 'Maharashtra', country: 'India', pincode: 411001, latitude: 18.5204, longitude: 73.8567 },
  { city_id: 'kolkata-001', name: 'Kolkata', slug: 'kolkata', state: 'West Bengal', country: 'India', pincode: 700001, latitude: 22.5726, longitude: 88.3639 },
  { city_id: 'ahmedabad-001', name: 'Ahmedabad', slug: 'ahmedabad', state: 'Gujarat', country: 'India', pincode: 380001, latitude: 23.0225, longitude: 72.5714 },
  { city_id: 'jaipur-001', name: 'Jaipur', slug: 'jaipur', state: 'Rajasthan', country: 'India', pincode: 302001, latitude: 26.9124, longitude: 75.7873 },
  { city_id: 'lucknow-001', name: 'Lucknow', slug: 'lucknow', state: 'Uttar Pradesh', country: 'India', pincode: 226001, latitude: 26.8467, longitude: 80.9462 },
];

export const seedCities = async () => {
  try {
    // Check if cities already exist
    const existingCount = await City.countDocuments();
    if (existingCount > 0) {
      logger.info(`Cities already exist in database (${existingCount} found). Skipping seed.`);
      return;
    }

    const filePath = path.resolve(__dirname, 'prod_carsalahakar.cities.json');
    let citiesToInsert: any[] = [];

    if (fs.existsSync(filePath)) {
      logger.info('Reading city data file...');
      const raw = fs.readFileSync(filePath, 'utf-8');
      const rawCities: RawCity[] = JSON.parse(raw);
      logger.info(`Found ${rawCities.length} cities in JSON file`);

      // Map raw data to model shape
      citiesToInsert = rawCities.map((c) => ({
        city_id: c.city_uuid,
        name: c.city_name,
        slug: c.slug,
        state: c.state,
        country: 'India',
        pincode: c.pincode ?? undefined,
        longitude: c.longitude,
        latitude: c.latitude,
      }));
    } else {
      logger.warn(`City data file not found at: ${filePath}. Using default cities.`);
      citiesToInsert = DEFAULT_CITIES;
    }

    // Insert in batches
    let inserted = 0;
    for (let i = 0; i < citiesToInsert.length; i += BATCH_SIZE) {
      const batch = citiesToInsert.slice(i, i + BATCH_SIZE);
      await City.insertMany(batch, { ordered: false });
      inserted += batch.length;
      logger.info(`Inserted ${inserted}/${citiesToInsert.length} cities`);
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
