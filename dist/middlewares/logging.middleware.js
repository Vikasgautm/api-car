"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const requestLogger = (req, res, next) => {
    const start = Date.now();
    // Log request
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${req.ip}`);
    // Log response
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        const statusColor = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : statusCode >= 300 ? '\x1b[36m' : '\x1b[32m';
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${statusColor}${statusCode}\x1b[0m - ${duration}ms`);
    });
    next();
};
exports.requestLogger = requestLogger;
