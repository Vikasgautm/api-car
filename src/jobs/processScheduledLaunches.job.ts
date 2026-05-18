import cron from 'node-cron';
import { logger } from '../utils/logger';
import { ScheduledLaunchService } from '../shared/services/scheduled-launch.service';

/**
 * Process scheduled car launches job
 * Runs every 30 minutes to execute any scheduled state transitions
 * that are due
 */
export class ProcessScheduledLaunchesJob {
  private static task: cron.ScheduledTask | null = null;

  static start() {
    if (this.task) {
      logger.warn('ProcessScheduledLaunchesJob is already running');
      return;
    }

    // Run every 30 minutes
    this.task = cron.schedule('*/30 * * * *', async () => {
      await this.execute();
    });

    logger.info('ProcessScheduledLaunchesJob scheduled to run every 30 minutes');
  }

  static stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('ProcessScheduledLaunchesJob stopped');
    }
  }

  static async execute() {
    try {
      logger.info('Starting ProcessScheduledLaunchesJob execution');

      const results = await ScheduledLaunchService.processScheduledLaunches();

      if (results.processed === 0) {
        logger.info('No scheduled launches to process');
        return;
      }

      logger.info(
        `ProcessScheduledLaunchesJob completed. Processed: ${results.processed}, Succeeded: ${results.succeeded}, Failed: ${results.failed}`
      );

      if (results.errors.length > 0) {
        logger.warn('Errors during scheduled launches processing:', results.errors);
      }
    } catch (error) {
      logger.error('Error in ProcessScheduledLaunchesJob:', error);
    }
  }
}
