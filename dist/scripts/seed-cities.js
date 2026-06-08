"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const config_1 = require("../config");
const city_model_1 = require("../models/city.model");
const BATCH_SIZE = 1000;
function resolveDate(v) {
    if (!v)
        return undefined;
    const raw = typeof v === 'object' ? v.$date : v;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? undefined : d;
}
function normalizeRecord(raw) {
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
        deleted_at: resolveDate(raw.deleted_at),
        createdAt: resolveDate(raw.createdAt),
        updatedAt: resolveDate(raw.updatedAt),
    };
}
async function run() {
    const jsonPath = process.argv[2]
        ? path_1.default.resolve(process.argv[2])
        : path_1.default.resolve(__dirname, '../../../city data/prod_carsalahakar-updated.cities.json');
    if (!fs_1.default.existsSync(jsonPath)) {
        console.error(`❌  File not found: ${jsonPath}`);
        process.exit(1);
    }
    console.log(`📂  Reading: ${jsonPath}`);
    const raw = JSON.parse(fs_1.default.readFileSync(jsonPath, 'utf-8'));
    console.log(`📊  Total records: ${raw.length}`);
    console.log(`🔌  Connecting to MongoDB…`);
    await mongoose_1.default.connect(config_1.config.mongodb_uri);
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
            const result = await city_model_1.City.bulkWrite(ops, { ordered: false });
            const batchInserted = result.upsertedCount;
            const batchSkipped = docs.length - batchInserted;
            inserted += batchInserted;
            skipped += batchSkipped;
            console.log(`inserted=${batchInserted}, skipped=${batchSkipped}`);
        }
        catch (err) {
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
    await mongoose_1.default.disconnect();
    process.exit(errors > 0 ? 1 : 0);
}
run().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
//# sourceMappingURL=seed-cities.js.map