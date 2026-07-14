"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mongoose_1 = __importDefault(require("mongoose"));
const BATCH_SIZE = 1000;
// ── CLI arg parsing ──────────────────────────────────────────────────────────
function getArg(flag) {
    const idx = process.argv.indexOf(flag);
    return idx !== -1 ? process.argv[idx + 1] : undefined;
}
const TARGET_URI = getArg('--uri');
const FILE_ARG = getArg('--file');
const DRY_RUN = process.argv.includes('--dry');
if (!TARGET_URI && !DRY_RUN) {
    console.error('❌  --uri is required.\n');
    console.error('  Usage: npx ts-node src/scripts/migrate-cities.ts --uri "mongodb+srv://..." [--file path] [--dry]');
    process.exit(1);
}
// ── Helpers ──────────────────────────────────────────────────────────────────
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
function maskUri(uri) {
    // Hide password in logs: mongodb+srv://user:PASS@host → mongodb+srv://user:***@host
    return uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
}
// ── City schema (inline so this script has no dependency on compiled app) ────
const mongoose_2 = require("mongoose");
const citySchema = new mongoose_2.Schema({
    city_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    state: { type: String, required: true },
    country: { type: String, default: 'India' },
    pincode: { type: String },
    longitude: { type: Number },
    latitude: { type: Number },
    is_published: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    noindex: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date },
}, { timestamps: true });
const City = (0, mongoose_2.model)('City', citySchema);
// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
    // 1. Locate JSON file
    const jsonPath = FILE_ARG
        ? path_1.default.resolve(FILE_ARG)
        : path_1.default.resolve(__dirname, '../../prod_carsalahakar-updated.cities.json');
    if (!fs_1.default.existsSync(jsonPath)) {
        console.error(`❌  JSON file not found: ${jsonPath}`);
        console.error('    Pass --file <path> to specify a custom location.');
        process.exit(1);
    }
    // 2. Parse
    console.log(`\n📂  Source : ${jsonPath}`);
    const raw = JSON.parse(fs_1.default.readFileSync(jsonPath, 'utf-8'));
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
    console.log(`\n🎯  Target : ${maskUri(TARGET_URI)}`);
    console.log('🔌  Connecting…');
    await mongoose_1.default.connect(TARGET_URI);
    console.log('✅  Connected\n');
    // 4. Check existing count
    const existingCount = await City.countDocuments();
    console.log(`ℹ️   Existing cities in target DB: ${existingCount}`);
    // 5. Batch upsert
    let inserted = 0;
    let skipped = 0;
    let errors = 0;
    const totalBatches = Math.ceil(docs.length / BATCH_SIZE);
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const batch = docs.slice(i, i + BATCH_SIZE);
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
            skipped += batch.length - result.upsertedCount;
            console.log(`inserted=${result.upsertedCount}  skipped=${batch.length - result.upsertedCount}`);
        }
        catch (err) {
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
    await mongoose_1.default.disconnect();
    process.exit(errors > 0 ? 1 : 0);
}
run().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
