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
const Sentry = __importStar(require("@sentry/node"));
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || "development",
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    });
}
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("./config");
const logging_middleware_1 = require("./middlewares/logging.middleware");
const rate_limit_middleware_1 = require("./middlewares/rate-limit.middleware");
// Import routes
const error_middleware_1 = require("./middlewares/error.middleware");
const routes_1 = __importDefault(require("./shared/routes"));
const app_error_util_1 = require("./shared/utils/app-error.util");
const sitemap_controller_1 = require("./modules/sitemap/controllers/sitemap.controller");
const cache_util_1 = require("./utils/cache.util");
// Swagger Documentation Setup
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const app = (0, express_1.default)();
// Behind a reverse proxy (PM2/nginx/Netlify): trust the first proxy hop so
// express-rate-limit keys off the real client IP via X-Forwarded-For rather
// than the proxy's IP. Keep this a specific hop count — never `true`, which
// lets clients spoof X-Forwarded-For and defeat IP-based rate limiting.
app.set("trust proxy", 1);
// Middlewares
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: {
        policy: "cross-origin",
    },
}));
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
});
app.use(logging_middleware_1.requestLogger);
// CORS must run before rate limiters so blocked responses still carry CORS headers
app.use((0, cors_1.default)({
    origin: config_1.config.cors_origin,
    credentials: true,
}));
app.use(rate_limit_middleware_1.globalRateLimiter);
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '2mb' }));
app.use(express_1.default.urlencoded({ limit: '2mb', extended: true }));
app.use((0, cookie_parser_1.default)());
// Base route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Welcome to Car Salahakar API",
        status: "healthy",
        version: "1.0.0",
    });
});
app.use("/uploads", express_1.default.static("uploads"));
app.use('/api/v1/discover', rate_limit_middleware_1.discoverRateLimiter);
app.use('/api/v1/cars/public', rate_limit_middleware_1.publicCarsRateLimiter);
app.use('/api/v1/content-health/admin', rate_limit_middleware_1.adminRateLimiter);
app.use('/api/v1/chatbot', rate_limit_middleware_1.chatbotRateLimiter);
app.get('/sitemap.xml', sitemap_controller_1.SitemapController.getXml);
app.get('/debug/cache', (req, res) => {
    const key = typeof req.query.key === 'string' ? req.query.key : undefined;
    const pattern = typeof req.query.pattern === 'string' ? req.query.pattern : undefined;
    if (key) {
        cache_util_1.cache.delete(key);
        return res.json({ deletedKey: key, size: cache_util_1.cache.size, entries: cache_util_1.cache.debugSnapshot() });
    }
    if (pattern) {
        cache_util_1.cache.invalidatePattern(pattern);
        return res.json({ deletedPattern: pattern, size: cache_util_1.cache.size, entries: cache_util_1.cache.debugSnapshot() });
    }
    res.json({ size: cache_util_1.cache.size, entries: cache_util_1.cache.debugSnapshot() });
});
app.delete('/debug/cache', (req, res) => {
    const key = typeof req.query.key === 'string' ? req.query.key : undefined;
    const pattern = typeof req.query.pattern === 'string' ? req.query.pattern : undefined;
    if (key) {
        cache_util_1.cache.delete(key);
        return res.json({ deletedKey: key, size: cache_util_1.cache.size, entries: cache_util_1.cache.debugSnapshot() });
    }
    if (pattern) {
        cache_util_1.cache.invalidatePattern(pattern);
        return res.json({ deletedPattern: pattern, size: cache_util_1.cache.size, entries: cache_util_1.cache.debugSnapshot() });
    }
    cache_util_1.cache.clear();
    res.json({ clearedAll: true, size: cache_util_1.cache.size, entries: cache_util_1.cache.debugSnapshot() });
});
app.use("/api/v1", routes_1.default);
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Car Salahakar API Documentation",
            version: "1.0.0",
            description: "API documentation for the Car Salahakar (API-Car) system",
        },
        servers: [
            {
                url: "/api/v1",
                description: "API server",
            },
        ],
    },
    apis: ["./src/modules/**/*.ts", "./src/shared/routes/*.ts"],
};
const swaggerDocs = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocs));
// Handle 404 - Route not found
app.use((req, res, next) => {
    next(new app_error_util_1.AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
// Sentry error handler must come before the custom error handler
if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
}
// Error handling
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
