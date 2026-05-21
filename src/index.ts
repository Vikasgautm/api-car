import mongoose from "mongoose";
import app from "./app";
import { config } from "./config";
import { UpdateUpcomingCarsJob } from "./jobs/updateUpcomingCars.job";
import { ProcessScheduledLaunchesJob } from "./jobs/processScheduledLaunches.job";
import { createDefaultSuperAdmin } from "./seeds/admin.seed";
import { seedCities } from "./seeds/city.seed";
import { logger } from "./utils/logger";
import { computeMileageClassesIfNeeded } from "./seeds/compute-mileage-classes.seed";
import { seedFuelTypes } from "./seeds/fuel-type.seed";
import { seedIntentTags } from "./seeds/intent-tags.seed";
import { auditRoutes, logRouteAudit } from "./shared/utils/route-audit.util";

const startServer = async () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    logger.warn('ANTHROPIC_API_KEY is not set — LLM intelligence flags and spec refinement will be disabled until the env var is configured');
  }

  try {
    // MongoDB Connection
    await mongoose.connect(config.mongodb_uri);
    logger.info("Successfully connected to MongoDB", { mongodb_uri: config.mongodb_uri });
    console.log("MongoDB URI:", config.mongodb_uri);
    
    // Create default superadmin
    await createDefaultSuperAdmin();

    // Seed cities from JSON file
    await seedCities();

    // Seed default fuel types
    await seedFuelTypes();

    // Seed intent taxonomy (intent category + 19 default intent tags)
    await seedIntentTags();

    // Backfill mileage / EV-range classifications for any variant or car still missing them.
    await computeMileageClassesIfNeeded();

    // Start auto-launch cron jobs
    UpdateUpcomingCarsJob.start();
    ProcessScheduledLaunchesJob.start();

    // Start Express Server
    app.listen(config.port, () => {
      logger.info(`Server is running on http://localhost:${config.port}`);

      // Audit routes to catch missing or duplicate endpoints
      const audit = auditRoutes(app);
      // Debug logging disabled - see api-car/src/ROUTES_CONSOLIDATED.md for full route documentation
      // logRouteAudit(audit);
      if (audit.warnings.length > 0) {
        logger.warn(`Route audit detected ${audit.warnings.length} warning(s)`);
      }
    });
  } catch (error) {
    logger.error("Error starting server:", error);
    process.exit(1);
  }
};

startServer();
