"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    // Rate limiters use express-rate-limit's default in-memory store, which is
    // per-process. That is accurate in fork mode (a single instance) but NOT in
    // PM2 cluster mode, where each worker keeps its own counter and the effective
    // limit multiplies by the worker count. Warn loudly so this isn't discovered
    // in production. Fix when scaling out: back the limiters with a shared store
    // (e.g. rate-limit-redis) gated behind a REDIS_URL env var.
    if (process.env.exec_mode === 'cluster_mode' || Number(process.env.NODE_APP_INSTANCE) > 0) {
        logger_1.logger.warn('Running under PM2 cluster mode with an in-memory rate-limit store — limits are enforced per-worker, not globally. Configure a shared store (rate-limit-redis) before relying on exact limits.');
    }
    try {
        // MongoDB Connection
        await mongoose_1.default.connect(config_1.config.mongodb_uri, { dbName: config_1.config.mongodb_db_name });
        logger_1.logger.info("Successfully connected to MongoDB", { mongodb_uri: config_1.config.mongodb_uri, dbName: config_1.config.mongodb_db_name });
        console.log("MongoDB URI:", config_1.config.mongodb_uri, "Database:", config_1.config.mongodb_db_name);
        // Redis Connection
        const { redis } = await Promise.resolve().then(() => __importStar(require("./shared/utils/redis")));
        await redis.connect();
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
