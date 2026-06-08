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
export {};
//# sourceMappingURL=migrate-cities.d.ts.map