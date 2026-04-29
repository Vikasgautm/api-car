"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedCities = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const city_model_1 = require("../models/city.model");
const logger_1 = require("../utils/logger");
const BATCH_SIZE = 500;
const seedCities = async () => {
    try {
        const filePath = path_1.default.resolve(__dirname, 'prod_carsalahakar.cities.json');
        if (!fs_1.default.existsSync(filePath)) {
            logger_1.logger.error(`City data file not found at: ${filePath}`);
            return;
        }
        logger_1.logger.info('Reading city data file...');
        const raw = fs_1.default.readFileSync(filePath, 'utf-8');
        const rawCities = JSON.parse(raw);
        logger_1.logger.info(`Found ${rawCities.length} cities in JSON file`);
        // Check if cities already exist
        const existingCount = await city_model_1.City.countDocuments();
        if (existingCount > 0) {
            logger_1.logger.info(`Cities already exist in database (${existingCount} found). Skipping seed.`);
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
            await city_model_1.City.insertMany(batch, { ordered: false });
            inserted += batch.length;
            logger_1.logger.info(`Inserted ${inserted}/${mappedCities.length} cities`);
        }
        logger_1.logger.info(`City seed completed. Total inserted: ${inserted}`);
    }
    catch (error) {
        if (error.writeErrors) {
            // Partial success with ordered:false — some duplicates may exist
            logger_1.logger.warn(`City seed completed with ${error.writeErrors.length} write errors (likely duplicates)`);
            logger_1.logger.info(`Successfully inserted: ${error.insertedCount ?? 'unknown'}`);
        }
        else {
            logger_1.logger.error('Error seeding cities:', error);
        }
    }
};
exports.seedCities = seedCities;
//# sourceMappingURL=city.seed.js.map