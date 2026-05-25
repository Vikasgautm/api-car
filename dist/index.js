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
const admin_seed_1 = require("./seeds/admin.seed");
const city_seed_1 = require("./seeds/city.seed");
const logger_1 = require("./utils/logger");
const compute_mileage_classes_seed_1 = require("./seeds/compute-mileage-classes.seed");
const fuel_type_seed_1 = require("./seeds/fuel-type.seed");
const intent_tags_seed_1 = require("./seeds/intent-tags.seed");
const popular_collections_seed_1 = require("./seeds/popular-collections.seed");
const route_audit_util_1 = require("./shared/utils/route-audit.util");
const startServer = async () => {
    if (!process.env.ANTHROPIC_API_KEY) {
        logger_1.logger.warn('ANTHROPIC_API_KEY is not set — LLM intelligence flags and spec refinement will be disabled until the env var is configured');
    }
    try {
        // MongoDB Connection
        await mongoose_1.default.connect(config_1.config.mongodb_uri);
        logger_1.logger.info("Successfully connected to MongoDB", { mongodb_uri: config_1.config.mongodb_uri });
        console.log("MongoDB URI:", config_1.config.mongodb_uri);
        // Create default superadmin
        await (0, admin_seed_1.createDefaultSuperAdmin)();
        // Seed cities from JSON file
        await (0, city_seed_1.seedCities)();
        // Seed default fuel types
        await (0, fuel_type_seed_1.seedFuelTypes)();
        // Seed intent taxonomy (intent category + 19 default intent tags)
        await (0, intent_tags_seed_1.seedIntentTags)();
        // Backfill mileage / EV-range classifications for any variant or car still missing them.
        await (0, compute_mileage_classes_seed_1.computeMileageClassesIfNeeded)();
        // Seed popular collections (runs once — skips if any collections already exist)
        await (0, popular_collections_seed_1.seedPopularCollections)();
        // Start auto-launch cron jobs
        updateUpcomingCars_job_1.UpdateUpcomingCarsJob.start();
        processScheduledLaunches_job_1.ProcessScheduledLaunchesJob.start();
        // Start Express Server
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
    }
    catch (error) {
        logger_1.logger.error("Error starting server:", error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map