import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  });
}

import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { config } from "./config";
import { requestLogger } from "./middlewares/logging.middleware";
import { adminRateLimiter, chatbotRateLimiter, discoverRateLimiter, globalRateLimiter, publicCarsRateLimiter } from "./middlewares/rate-limit.middleware";

const app: Application = express();

// Behind a reverse proxy (PM2/nginx/Netlify): trust the first proxy hop so
// express-rate-limit keys off the real client IP via X-Forwarded-For rather
// than the proxy's IP. Keep this a specific hop count — never `true`, which
// lets clients spoof X-Forwarded-For and defeat IP-based rate limiting.
app.set("trust proxy", 1);

// Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});
app.use(requestLogger);
// CORS must run before rate limiters so blocked responses still carry CORS headers
app.use(
  cors({
    origin: config.cors_origin,
    credentials: true,
  }),
);
app.use(globalRateLimiter);
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));
app.use(cookieParser());

// Base route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to Car Salahakar API",
    status: "healthy",
    version: "1.0.0",
  });
});

// Import routes
import { errorMiddleware } from "./middlewares/error.middleware";
import routes from "./shared/routes";
import { AppError } from "./shared/utils/app-error.util";
import { SitemapController } from "./modules/sitemap/controllers/sitemap.controller";
app.use("/uploads", express.static("uploads"));
app.use('/api/v1/discover', discoverRateLimiter);
app.use('/api/v1/cars/public', publicCarsRateLimiter);
app.use('/api/v1/content-health/admin', adminRateLimiter);
app.use('/api/v1/chatbot', chatbotRateLimiter);
app.get('/sitemap.xml', SitemapController.getXml);
app.use("/api/v1", routes);

// Handle 404 - Route not found
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Sentry error handler must come before the custom error handler
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Error handling
app.use(errorMiddleware);

export default app;
