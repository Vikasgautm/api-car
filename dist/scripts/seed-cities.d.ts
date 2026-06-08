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
export {};
//# sourceMappingURL=seed-cities.d.ts.map