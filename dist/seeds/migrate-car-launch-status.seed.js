"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateCarLaunchStatus = migrateCarLaunchStatus;
const car_model_1 = require("../models/car.model");
const logger_1 = require("../utils/logger");
/**
 * Migration script for car launch status fields
 * Handles backward compatibility for old field names and values
 */
async function migrateCarLaunchStatus() {
    try {
        logger_1.logger.info('Starting car launch status migration...');
        const cars = await car_model_1.Car.find({ is_deleted: false });
        let updatedCount = 0;
        let skippedCount = 0;
        for (const car of cars) {
            let needsUpdate = false;
            const updateData = {};
            // Handle old typo field 'upcomming' - migrate to is_upcoming
            if (car.upcomming !== undefined && car.is_upcoming === undefined) {
                updateData.is_upcoming = car.upcomming;
                needsUpdate = true;
                logger_1.logger.info(`Migrating upcomming to is_upcoming for car: ${car.car_id}`);
            }
            // Handle old field 'upcoming' - migrate to is_upcoming
            if (car.upcoming !== undefined && car.is_upcoming === undefined) {
                updateData.is_upcoming = car.upcoming;
                needsUpdate = true;
                logger_1.logger.info(`Migrating upcoming to is_upcoming for car: ${car.car_id}`);
            }
            // Handle old status 'on_sale' - migrate to 'launched'
            if (car.status === 'on_sale') {
                updateData.status = 'launched';
                needsUpdate = true;
                logger_1.logger.info(`Migrating status on_sale to launched for car: ${car.car_id}`);
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
                await car_model_1.Car.findOneAndUpdate({ car_id: car.car_id, is_deleted: false }, updateData, { returnDocument: 'after' });
                updatedCount++;
            }
            else {
                skippedCount++;
            }
        }
        logger_1.logger.info(`Car launch status migration completed. Updated: ${updatedCount}, Skipped: ${skippedCount}`);
        return { updatedCount, skippedCount };
    }
    catch (error) {
        logger_1.logger.error('Error during car launch status migration:', error);
        throw error;
    }
}
/**
 * Run migration if called directly
 */
if (require.main === module) {
    migrateCarLaunchStatus()
        .then(() => {
        logger_1.logger.info('Migration completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.logger.error('Migration failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=migrate-car-launch-status.seed.js.map