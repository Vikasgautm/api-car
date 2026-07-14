import Redis from 'ioredis';
import { logger } from '../../utils/logger';
import { config } from '../../config';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('connect', () => {
  logger.info('Successfully connected to Redis');
});

redis.on('error', (err) => {
  logger.error('Redis connection error:', err);
});
