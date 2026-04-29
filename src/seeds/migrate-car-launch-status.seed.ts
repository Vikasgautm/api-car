import { Car } from '../models/car.model';
import { logger } from '../utils/logger';

/**
 * Migration script for car launch status fields
 * Handles backward compatibility for old field names and values
 */
export async function migrateCarLaunchStatus() {
  try {
    logger.info('Starting car launch status migration...');

    const cars = await Car.find({ is_deleted: false });

    let updatedCount = 0;
    let skippedCount = 0;

    for (const car of cars) {
      let needsUpdate = false;
      const updateData: any = {};

      // Handle old typo field 'upcomming' - migrate to is_upcoming
      if ((car as any).upcomming !== undefined && car.is_upcoming === undefined) {
        updateData.is_upcoming = (car as any).upcomming;
        needsUpdate = true;
        logger.info(`Migrating upcomming to is_upcoming for car: ${car.car_id}`);
      }

      // Handle old field 'upcoming' - migrate to is_upcoming
      if ((car as any).upcoming !== undefined && car.is_upcoming === undefined) {
        updateData.is_upcoming = (car as any).upcoming;
        needsUpdate = true;
        logger.info(`Migrating upcoming to is_upcoming for car: ${car.car_id}`);
      }

      // Handle old status 'on_sale' - migrate to 'launched'
      if ((car.status as any) === 'on_sale') {
        updateData.status = 'launched';
        needsUpdate = true;
        logger.info(`Migrating status on_sale to launched for car: ${car.car_id}`);
      }

      // Set default values for new boolean fields if undefined
      if (car.is_upcoming === undefined) {
        updateData.is_upcoming = car.status === 'upcoming';
        needsUpdate = true;
      }

      if (car.is_launched === undefined) {
        updateData.is_launched = car.status !== 'upcoming' && car.status !== 'discontinued';
        needsUpdate = true;
      }

      if (car.is_popular === undefined) {
        updateData.is_popular = false;
        needsUpdate = true;
      }

      if (car.is_recommended === undefined) {
        updateData.is_recommended = false;
        needsUpdate = true;
      }

      if (car.is_featured === undefined) {
        updateData.is_featured = false;
        needsUpdate = true;
      }

      if (car.is_latest === undefined) {
        updateData.is_latest = false;
        needsUpdate = true;
      }

      if (car.top_selling === undefined) {
        updateData.top_selling = false;
        needsUpdate = true;
      }

      // Ensure status consistency
      if (car.is_upcoming === true && car.status !== 'upcoming') {
        updateData.status = 'upcoming';
        updateData.is_launched = false;
        needsUpdate = true;
      }

      if (car.is_upcoming === false && car.status === 'upcoming') {
        updateData.status = 'launched';
        updateData.is_launched = true;
        needsUpdate = true;
      }

      if (car.status === 'discontinued') {
        updateData.is_upcoming = false;
        updateData.is_launched = false;
        needsUpdate = true;
      }

      // Initialize null fields if undefined
      if (car.expected_exshowroom_price === undefined) {
        updateData.expected_exshowroom_price = null;
        needsUpdate = true;
      }

      if (car.expected_launch_date === undefined) {
        updateData.expected_launch_date = null;
        needsUpdate = true;
      }

      if (car.exshowroom_price === undefined) {
        updateData.exshowroom_price = null;
        needsUpdate = true;
      }

      if (car.launch_date === undefined) {
        updateData.launch_date = null;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await Car.findOneAndUpdate(
          { car_id: car.car_id, is_deleted: false },
          updateData,
          { returnDocument: 'after' }
        );
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    logger.info(`Car launch status migration completed. Updated: ${updatedCount}, Skipped: ${skippedCount}`);
    return { updatedCount, skippedCount };
  } catch (error) {
    logger.error('Error during car launch status migration:', error);
    throw error;
  }
}

/**
 * Run migration if called directly
 */
if (require.main === module) {
  migrateCarLaunchStatus()
    .then(() => {
      logger.info('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}
