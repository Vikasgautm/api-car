"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("./config");
const app = (0, express_1.default)();
// Middlewares
// app.use(helmet());
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: {
        policy: "cross-origin",
    },
}));
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
});
// app.use(globalRateLimiter);
app.use((0, cors_1.default)({
    origin: config_1.config.cors_origin,
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Base route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Welcome to Car Salahakar API",
        status: "healthy",
        version: "1.0.0",
    });
});
// Import routes
const error_middleware_1 = require("./middlewares/error.middleware");
const routes_1 = __importDefault(require("./shared/routes"));
app.use("/uploads", express_1.default.static("uploads"));
app.use("/api/v1", routes_1.default);
// Handle 404 - Route not found
app.use((req, res, next) => {
    next(new error_middleware_1.AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
// Error handling
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
//# sourceMappingURL=app.js.map