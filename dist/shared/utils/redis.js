"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../../utils/logger");
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
exports.redis = new ioredis_1.default(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
});
exports.redis.on('connect', () => {
    logger_1.logger.info('Successfully connected to Redis');
});
exports.redis.on('error', (err) => {
    logger_1.logger.error('Redis connection error:', err);
});
