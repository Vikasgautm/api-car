"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const updateUpcomingCars_job_1 = require("./jobs/updateUpcomingCars.job");
const admin_seed_1 = require("./seeds/admin.seed");
const city_seed_1 = require("./seeds/city.seed");
const logger_1 = require("./utils/logger");
const compute_mileage_classes_seed_1 = require("./seeds/compute-mileage-classes.seed");
const fuel_type_seed_1 = require("./seeds/fuel-type.seed");
const intent_tags_seed_1 = require("./seeds/intent-tags.seed");
const startServer = async () => {
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
        // Start auto-launch cron job
        updateUpcomingCars_job_1.UpdateUpcomingCarsJob.start();
        // Start Express Server
        app_1.default.listen(config_1.config.port, () => {
            logger_1.logger.info(`Server is running on http://localhost:${config_1.config.port}`);
        });
    }
    catch (error) {
        logger_1.logger.error("Error starting server:", error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map