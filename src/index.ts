import mongoose from "mongoose";
import app from "./app";
import { config } from "./config";
import { UpdateUpcomingCarsJob } from "./jobs/updateUpcomingCars.job";
import { createDefaultSuperAdmin } from "./seeds/admin.seed";
import { seedCities } from "./seeds/city.seed";
import { logger } from "./utils/logger";

const startServer = async () => {
  try {
    // MongoDB Connection
    await mongoose.connect(config.mongodb_uri);
    logger.info("Successfully connected to MongoDB", { mongodb_uri: config.mongodb_uri });
    console.log("MongoDB URI:", config.mongodb_uri);
    
    // Create default superadmin
    await createDefaultSuperAdmin();

    // Seed cities from JSON file
    await seedCities();

    // Start auto-launch cron job
    UpdateUpcomingCarsJob.start();

    // Start Express Server
    app.listen(config.port, () => {
      logger.info(`Server is running on http://localhost:${config.port}`);
    });
  } catch (error) {
    logger.error("Error starting server:", error);
    process.exit(1);
  }
};

startServer();
