"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatbotRateLimiter = exports.publicCarsRateLimiter = exports.discoverRateLimiter = exports.uploadRateLimiter = exports.authRateLimiter = exports.adminRateLimiter = exports.globalRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
// Skip IP rate limiting only for requests carrying a *valid* admin JWT.
// Checking merely for the presence of an Authorization header (or a "/admin"
// substring in the path) let anyone bypass the global limiter by sending a
// junk header — so we verify the token signature here instead.
const isAdminRequest = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
        return false;
    try {
        jsonwebtoken_1.default.verify(authHeader.substring(7), config_1.config.jwt_secret);
        return true;
    }
    catch {
        return false;
    }
};
exports.globalRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skip: isAdminRequest,
});
// Generous limiter for authenticated admin API routes
exports.adminRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: 'Too many admin requests, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 login/signup attempts per hour
    message: 'Too many authentication attempts, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
});
exports.uploadRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Limit each IP to 50 upload requests per hour
    message: 'Too many upload attempts, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
});
exports.discoverRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60_000,
    max: 60,
    message: 'Too many discovery requests, please try again after a minute',
    standardHeaders: true,
    legacyHeaders: false,
});
exports.publicCarsRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60_000,
    max: 120,
    message: 'Too many requests, please try again after a minute',
    standardHeaders: true,
    legacyHeaders: false,
});
exports.chatbotRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: Number(process.env.ADMIN_CHATBOT_RATE_LIMIT_WINDOW_MS) || 60_000,
    max: Number(process.env.ADMIN_CHATBOT_RATE_LIMIT_MAX) || 30,
    message: 'Too many chatbot requests, please wait a moment before asking again.',
    standardHeaders: true,
    legacyHeaders: false,
});
