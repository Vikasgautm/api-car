/**
 * Migration Script: Convert CarImage foreign keys from ObjectId to String
 * 
 * This script migrates:
 * - car_id: ObjectId → String (car.car_id)
 * - variant_id: ObjectId → String (variant.variant_id)
 * - category_id: ObjectId → String (image_category.category_id)
 * - sub_category_id: ObjectId → String (image_subcategory.subcategory_id)
 * 
 * IMPORTANT: Backup your database before running this script!
 * Run with: npm run ts-node scripts/migrations/001-migrate-carimage-ids.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function migrateCarImageIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-salahakar');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const carImagesCollection = db.collection('carimages');

    console.log('Starting migration of CarImage foreign keys...');

    // Get all car images
    const carImages = await carImagesCollection.find({}).toArray();
    console.log(`Found ${carImages.length} car images to migrate`);

    let updated = 0;
    let errors = 0;

    for (const image of carImages) {
      try {
        const updateData: any = {};

        // Convert car_id from ObjectId to String
        if (image.car_id && typeof image.car_id === 'object') {
          const car = await db.collection('cars').findOne({ _id: image.car_id });
          if (car && car.car_id) {
            updateData.car_id = car.car_id;
          }
        }

        // Convert variant_id from ObjectId to String
        if (image.variant_id && typeof image.variant_id === 'object') {
          const variant = await db.collection('carvariants').findOne({ _id: image.variant_id });
          if (variant && variant.variant_id) {
            updateData.variant_id = variant.variant_id;
          }
        }

        // Convert category_id from ObjectId to String
        if (image.category_id && typeof image.category_id === 'object') {
          const category = await db.collection('imagecategories').findOne({ _id: image.category_id });
          if (category && category.category_id) {
            updateData.category_id = category.category_id;
          }
        }

        // Convert sub_category_id from ObjectId to String
        if (image.sub_category_id && typeof image.sub_category_id === 'object') {
          const subcategory = await db.collection('imagesubcategories').findOne({ _id: image.sub_category_id });
          if (subcategory && subcategory.subcategory_id) {
            updateData.sub_category_id = subcategory.subcategory_id;
          }
        }

        if (Object.keys(updateData).length > 0) {
          await carImagesCollection.updateOne(
            { _id: image._id },
            { $set: updateData }
          );
          updated++;
          console.log(`Updated car image ${image.car_image_id || image._id}`);
        }
      } catch (err) {
        console.error(`Error migrating car image ${image._id}:`, err);
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

migrateCarImageIds();
