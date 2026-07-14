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
const BATCH_SIZE = 1000;
function resolveDate(v) {
    if (!v)
        return undefined;
    const raw = typeof v === 'object' ? v.$date : v;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? undefined : d;
}
function normalize(c) {
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
        deleted_at: resolveDate(c.deleted_at),
        createdAt: resolveDate(c.createdAt),
        updatedAt: resolveDate(c.updatedAt),
    };
}
// JSON file lives at <project-root>/city data/ — one level above api-car/
const JSON_PATH = path_1.default.resolve(__dirname, '../../../city data/prod_carsalahakar-updated.cities.json');
const seedCities = async () => {
    try {
        if (!fs_1.default.existsSync(JSON_PATH)) {
            logger_1.logger.warn(`City seed: JSON file not found at ${JSON_PATH} — skipping`);
            return;
        }
        const rawCities = JSON.parse(fs_1.default.readFileSync(JSON_PATH, 'utf-8'));
        const total = rawCities.length;
        const existingCount = await city_model_1.City.countDocuments();
        if (existingCount >= total) {
            logger_1.logger.info(`City seed: ${existingCount} cities already in DB — skipping`);
            return;
        }
        logger_1.logger.info(`City seed: found ${total} records in JSON, ${existingCount} in DB — upserting…`);
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
            const result = await city_model_1.City.bulkWrite(ops, { ordered: false });
            inserted += result.upsertedCount;
            skipped += docs.length - result.upsertedCount;
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            logger_1.logger.info(`City seed: batch ${batchNum}/${totalBatches} — inserted=${result.upsertedCount}`);
        }
        logger_1.logger.info(`City seed complete — inserted: ${inserted}, skipped: ${skipped}`);
    }
    catch (error) {
        logger_1.logger.error('City seed error:', error);
    }
};
exports.seedCities = seedCities;
