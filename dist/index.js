"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const updateUpcomingCars_job_1 = require("./jobs/updateUpcomingCars.job");
const processScheduledLaunches_job_1 = require("./jobs/processScheduledLaunches.job");
const logger_1 = require("./utils/logger");
const compute_mileage_classes_seed_1 = require("./seeds/compute-mileage-classes.seed");
const route_audit_util_1 = require("./shared/utils/route-audit.util");
const startServer = async () => {
    if (!process.env.CEREBRAS_API_KEY) {
        logger_1.logger.warn('CEREBRAS_API_KEY is not set — LLM intelligence flags and spec refinement will be disabled until the env var is configured');
    }
    try {
        // MongoDB Connection
        await mongoose_1.default.connect(config_1.config.mongodb_uri);
        logger_1.logger.info("Successfully connected to MongoDB", { mongodb_uri: config_1.config.mongodb_uri });
        console.log("MongoDB URI:", config_1.config.mongodb_uri);
        // Run lightweight idempotent seeds in parallel to minimise startup time.
        // Each seed is a no-op when data already exists, so ordering doesn't matter.
        // await Promise.all([
        //   createDefaultSuperAdmin(),
        //   seedCities(),
        //   seedFuelTypes(),
        //   seedIntentTags(),
        //   seedPopularCollections(),
        //   seedMasterData(),
        // ]);
        // Start cron jobs
        updateUpcomingCars_job_1.UpdateUpcomingCarsJob.start();
        processScheduledLaunches_job_1.ProcessScheduledLaunchesJob.start();
        // Start accepting HTTP traffic immediately — health checks pass from this point.
        app_1.default.listen(config_1.config.port, () => {
            logger_1.logger.info(`Server is running on http://localhost:${config_1.config.port}`);
            // Audit routes to catch missing or duplicate endpoints
            const audit = (0, route_audit_util_1.auditRoutes)(app_1.default);
            // Debug logging disabled - see api-car/src/ROUTES_CONSOLIDATED.md for full route documentation
            // logRouteAudit(audit);
            if (audit.warnings.length > 0) {
                logger_1.logger.warn(`Route audit detected ${audit.warnings.length} warning(s)`);
            }
        });
        // Run the heavy backfill asynchronously AFTER the server is already listening.
        // This scan can take seconds on large datasets and must not block readiness.
        setImmediate(async () => {
            try {
                await (0, compute_mileage_classes_seed_1.computeMileageClassesIfNeeded)();
                logger_1.logger.info('Mileage class backfill completed successfully');
            }
            catch (backfillError) {
                logger_1.logger.error('Mileage class backfill failed (non-fatal):', backfillError);
            }
        });
    }
    catch (error) {
        logger_1.logger.error("Error starting server:", error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map