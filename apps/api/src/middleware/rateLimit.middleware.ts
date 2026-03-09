import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

import { redis } from '@/lib/redis';

function prefixKey(prefix: string): string {
  return `ratelimit:${prefix}`;
}

function createLimiter(prefix: string, windowMs: number, max: number): RequestHandler {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
    store: new RedisStore({
      sendCommand: async (command: string, ...args: string[]) => {
        const result = await redis.call(command, ...args);
        return result as any;
      },
      prefix: prefixKey(prefix),
    }),
  });
}

export const generalLimiter = createLimiter('general', 60_000, 120);
export const authLimiter = createLimiter('auth', 60_000, 30);
export const uploadLimiter = createLimiter('upload', 60_000, 20);
