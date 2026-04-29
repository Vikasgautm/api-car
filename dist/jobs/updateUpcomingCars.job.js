"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUpcomingCarsJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const car_model_1 = require("../models/car.model");
const logger_1 = require("../utils/logger");
/**
 * Auto-launch job for upcoming cars
 * Runs daily at midnight to move upcoming cars to launched status
 * when their expected_launch_date has passed
 */
class UpdateUpcomingCarsJob {
    static task = null;
    static start() {
        if (this.task) {
            logger_1.logger.warn('UpdateUpcomingCarsJob is already running');
            return;
        }
        // Run daily at midnight (00:00)
        this.task = node_cron_1.default.schedule('0 0 * * *', async () => {
            await this.execute();
        });
        logger_1.logger.info('UpdateUpcomingCarsJob scheduled to run daily at midnight');
    }
    static stop() {
        if (this.task) {
            this.task.stop();
            this.task = null;
            logger_1.logger.info('UpdateUpcomingCarsJob stopped');
        }
    }
    static async execute() {
        try {
            logger_1.logger.info('Starting UpdateUpcomingCarsJob execution');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            // Find cars that should be auto-launched
            const carsToUpdate = await car_model_1.Car.find({
                is_upcoming: true,
                status: 'upcoming',
                expected_launch_date: { $lte: today },
                is_deleted: false,
            });
            if (carsToUpdate.length === 0) {
                logger_1.logger.info('No cars found for auto-launch');
                return;
            }
            logger_1.logger.info(`Found ${carsToUpdate.length} cars for auto-launch`);
            // Update each car
            let updatedCount = 0;
            for (const car of carsToUpdate) {
                try {
                    car.is_upcoming = false;
                    car.is_launched = true;
                    car.status = 'launched';
                    car.is_latest = true;
                    // Only set launch_date if it's empty
                    if (!car.launch_date) {
                        car.launch_date = today;
                    }
                    await car.save();
                    updatedCount++;
                    logger_1.logger.info(`Auto-launched car: ${car.name} (car_id: ${car.car_id})`);
                }
                catch (error) {
                    logger_1.logger.error(`Failed to auto-launch car ${car.car_id}:`, error);
                }
            }
            logger_1.logger.info(`UpdateUpcomingCarsJob completed. Updated ${updatedCount} cars`);
        }
        catch (error) {
            logger_1.logger.error('Error in UpdateUpcomingCarsJob:', error);
        }
    }
}
exports.UpdateUpcomingCarsJob = UpdateUpcomingCarsJob;
//# sourceMappingURL=updateUpcomingCars.job.js.map