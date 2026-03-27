import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { globalRateLimiter } from './middlewares/rate-limit.middleware';

const app: Application = express();

// Middlewares
app.use(helmet());
app.use(globalRateLimiter);
app.use(cors({
  origin: config.cors_origin,
  credentials: true,
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Base route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to Car Salahakar API',
    status: 'healthy',
    version: '1.0.0',
  });
});

// Import routes
import routes from './shared/routes';
import { errorMiddleware } from './middlewares/error.middleware';
app.use('/api/v1', routes);

// Error handling
app.use(errorMiddleware);

export default app;
