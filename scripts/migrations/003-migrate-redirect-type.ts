/**
 * Migration Script: Convert Redirect.type from String to Number
 * 
 * This script migrates type from String to Number enum:
 * - "301" → 301
 * - "302" → 302
 * - "307" → 307
 * - "308" → 308
 * 
 * IMPORTANT: Backup your database before running this script!
 * Run with: npm run ts-node scripts/migrations/003-migrate-redirect-type.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function migrateRedirectType() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-salahakar');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const redirectsCollection = db.collection('redirects');

    console.log('Starting migration of Redirect.type...');

    // Get all redirects with type as string
    const redirects = await redirectsCollection.find({ type: { $type: 'string' } }).toArray();
    console.log(`Found ${redirects.length} redirects to migrate`);

    let updated = 0;
    let errors = 0;

    for (const redirect of redirects) {
      try {
        const typeMapping: Record<string, number> = {
          '301': 301,
          '302': 302,
          '307': 307,
          '308': 308
        };

        const numericType = typeMapping[redirect.type];
        if (numericType !== undefined) {
          await redirectsCollection.updateOne(
            { _id: redirect._id },
            { $set: { type: numericType } }
          );
          updated++;
          console.log(`Updated redirect ${redirect._id}: ${redirect.type} → ${numericType}`);
        } else {
          console.log(`Unknown type value: ${redirect.type}, setting to 302`);
          await redirectsCollection.updateOne(
            { _id: redirect._id },
            { $set: { type: 302 } }
          );
          updated++;
        }
      } catch (err) {
        console.error(`Error migrating redirect ${redirect._id}:`, err);
        errors++;
      }
    }

    console.log(`Migration complete. Updated: ${updated}, Errors: ${errors}`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateRedirectType();
