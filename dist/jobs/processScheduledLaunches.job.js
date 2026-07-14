"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessScheduledLaunchesJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = require("../utils/logger");
const scheduled_launch_service_1 = require("../shared/services/scheduled-launch.service");
/**
 * Process scheduled car launches job
 * Runs every 30 minutes to execute any scheduled state transitions
 * that are due
 */
class ProcessScheduledLaunchesJob {
    static task = null;
    static start() {
        if (this.task) {
            logger_1.logger.warn('ProcessScheduledLaunchesJob is already running');
            return;
        }
        // Run every 30 minutes
        this.task = node_cron_1.default.schedule('*/30 * * * *', async () => {
            await this.execute();
        });
        logger_1.logger.info('ProcessScheduledLaunchesJob scheduled to run every 30 minutes');
    }
    static stop() {
        if (this.task) {
            this.task.stop();
            this.task = null;
            logger_1.logger.info('ProcessScheduledLaunchesJob stopped');
        }
    }
    static async execute() {
        try {
            logger_1.logger.info('Starting ProcessScheduledLaunchesJob execution');
            const results = await scheduled_launch_service_1.ScheduledLaunchService.processScheduledLaunches();
            if (results.processed === 0) {
                logger_1.logger.info('No scheduled launches to process');
                return;
            }
            logger_1.logger.info(`ProcessScheduledLaunchesJob completed. Processed: ${results.processed}, Succeeded: ${results.succeeded}, Failed: ${results.failed}`);
            if (results.errors.length > 0) {
                logger_1.logger.warn('Errors during scheduled launches processing:', results.errors);
            }
        }
        catch (error) {
            logger_1.logger.error('Error in ProcessScheduledLaunchesJob:', error);
        }
    }
}
exports.ProcessScheduledLaunchesJob = ProcessScheduledLaunchesJob;
