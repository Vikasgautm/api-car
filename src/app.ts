import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { config } from "./config";

const app: Application = express();

// Middlewares
// app.use(helmet());
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
// app.use(globalRateLimiter);
app.use(
  cors({
    origin: config.cors_origin,
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
import { AppError, errorMiddleware } from "./middlewares/error.middleware";
import routes from "./shared/routes";
app.use("/uploads", express.static("uploads"));
app.use("/v1", routes);

// Handle 404 - Route not found
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling
app.use(errorMiddleware);

export default app;
