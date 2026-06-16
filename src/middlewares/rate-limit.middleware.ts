import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// Skip IP rate limiting only for requests carrying a *valid* admin JWT.
// Checking merely for the presence of an Authorization header (or a "/admin"
// substring in the path) let anyone bypass the global limiter by sending a
// junk header — so we verify the token signature here instead.
const isAdminRequest = (req: Request): boolean => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  try {
    jwt.verify(authHeader.substring(7), config.jwt_secret);
    return true;
  } catch {
    return false;
  }
};

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

export const chatbotRateLimiter = rateLimit({
  windowMs: Number(process.env.ADMIN_CHATBOT_RATE_LIMIT_WINDOW_MS) || 60_000,
  max: Number(process.env.ADMIN_CHATBOT_RATE_LIMIT_MAX) || 30,
  message: 'Too many chatbot requests, please wait a moment before asking again.',
  standardHeaders: true,
  legacyHeaders: false,
});
