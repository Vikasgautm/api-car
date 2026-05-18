import cron from 'node-cron';
import { Car } from '../models/car.model';
import { logger } from '../utils/logger';
import { CarLifecycleService } from '../modules/cars/services/car-lifecycle.service';

/**
 * Auto-launch job for upcoming cars
 * Runs daily at midnight to move upcoming cars to launched status
 * when their expected_launch_date has passed
 */
export class UpdateUpcomingCarsJob {
  private static task: cron.ScheduledTask | null = null;

  static start() {
    if (this.task) {
      logger.warn('UpdateUpcomingCarsJob is already running');
      return;
    }

    // Run daily at midnight (00:00)
    this.task = cron.schedule('0 0 * * *', async () => {
      await this.execute();
    });

    logger.info('UpdateUpcomingCarsJob scheduled to run daily at midnight');
  }

  static stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('UpdateUpcomingCarsJob stopped');
    }
  }

  static async execute() {
    try {
      logger.info('Starting UpdateUpcomingCarsJob execution');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find cars that should be auto-launched
      const carsToUpdate = await Car.find({
        is_upcoming: true,
        status: 'upcoming',
        expected_launch_date: { $lte: today },
        is_deleted: false,
      });

      if (carsToUpdate.length === 0) {
        logger.info('No cars found for auto-launch');
        return;
      }

      logger.info(`Found ${carsToUpdate.length} cars for auto-launch`);

      // Parallelize state transitions for all cars to avoid sequential delays
      const transitionResults = await Promise.allSettled(
        carsToUpdate.map(car =>
          CarLifecycleService.transitionState(
            car.car_id,
            'launched',
            { user_id: 'system' }
          ).then(() => {
            logger.info(`Auto-launched car: ${car.name} (car_id: ${car.car_id})`);
            return { success: true, carId: car.car_id };
          }).catch(error => {
            logger.error(`Failed to auto-launch car ${car.car_id}:`, error);
            return { success: false, carId: car.car_id, error };
          })
        )
      );

      const updatedCount = transitionResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
      logger.info(`UpdateUpcomingCarsJob completed. Updated ${updatedCount} cars`);
    } catch (error) {
      logger.error('Error in UpdateUpcomingCarsJob:', error);
    }
  }
}
