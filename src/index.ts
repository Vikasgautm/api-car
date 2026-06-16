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
import { seedPopularCollections } from "./seeds/popular-collections.seed";
import { seedMasterData } from "./seeds/master-data.seed";
import { auditRoutes, logRouteAudit } from "./shared/utils/route-audit.util";

const startServer = async () => {
  if (!process.env.CEREBRAS_API_KEY) {
    logger.warn('CEREBRAS_API_KEY is not set — LLM intelligence flags and spec refinement will be disabled until the env var is configured');
  }

  // Rate limiters use express-rate-limit's default in-memory store, which is
  // per-process. That is accurate in fork mode (a single instance) but NOT in
  // PM2 cluster mode, where each worker keeps its own counter and the effective
  // limit multiplies by the worker count. Warn loudly so this isn't discovered
  // in production. Fix when scaling out: back the limiters with a shared store
  // (e.g. rate-limit-redis) gated behind a REDIS_URL env var.
  if (process.env.exec_mode === 'cluster_mode' || Number(process.env.NODE_APP_INSTANCE) > 0) {
    logger.warn(
      'Running under PM2 cluster mode with an in-memory rate-limit store — limits are enforced per-worker, not globally. Configure a shared store (rate-limit-redis) before relying on exact limits.',
    );
  }

  try {
    // MongoDB Connection
    await mongoose.connect(config.mongodb_uri);
    logger.info("Successfully connected to MongoDB", { mongodb_uri: config.mongodb_uri });
    console.log("MongoDB URI:", config.mongodb_uri);

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
    UpdateUpcomingCarsJob.start();
    ProcessScheduledLaunchesJob.start();

    // Start accepting HTTP traffic immediately — health checks pass from this point.
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

    // Run the heavy backfill asynchronously AFTER the server is already listening.
    // This scan can take seconds on large datasets and must not block readiness.
    setImmediate(async () => {
      try {
        await computeMileageClassesIfNeeded();
        logger.info('Mileage class backfill completed successfully');
      } catch (backfillError) {
        logger.error('Mileage class backfill failed (non-fatal):', backfillError);
      }
    });
  } catch (error) {
    logger.error("Error starting server:", error);
    process.exit(1);
  }
};

startServer();
