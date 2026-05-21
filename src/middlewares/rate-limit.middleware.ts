import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// Admin routes are JWT-protected — skip IP rate limiting for them.
const isAdminRequest = (req: Request): boolean =>
  req.path.includes('/admin') || !!req.headers.authorization;

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skip: isAdminRequest,
});

// Generous limiter for authenticated admin API routes
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Too many admin requests, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login/signup attempts per hour
  message: 'Too many authentication attempts, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 upload requests per hour
  message: 'Too many upload attempts, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

export const discoverRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  message: 'Too many discovery requests, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});

export const publicCarsRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  message: 'Too many requests, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});
