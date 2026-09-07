import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface Attempt {
  count: number;
  firstAttempt: number;
  blockedUntil: number;
}

// In-memory rate limiter: max 5 requests per 15 minutes per IP per route
const attempts = new Map<string, Attempt>();
const MAX_REQUESTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'unknown';
}

function cleanup() {
  const now = Date.now();
  for (const [key, attempt] of attempts.entries()) {
    if (now - attempt.firstAttempt > WINDOW_MS + BLOCK_DURATION_MS) {
      attempts.delete(key);
    }
  }
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup every 5 minutes
    this.timer = setInterval(cleanup, 5 * 60 * 1000);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const ip = getClientIp(req);
    const key = `${ip}:${req.route?.path || req.path}`;
    const now = Date.now();

    const attempt = attempts.get(key);

    if (attempt) {
      // Currently blocked
      if (now < attempt.blockedUntil) {
        const retryAfter = Math.ceil((attempt.blockedUntil - now) / 1000);
        res.set('Retry-After', String(retryAfter));
        throw new BadRequestException(
          `Too many requests. Please try again in ${retryAfter} seconds.`
        );
      }

      // Window expired, reset
      if (now - attempt.firstAttempt > WINDOW_MS) {
        attempts.delete(key);
      } else if (attempt.count >= MAX_REQUESTS) {
        // Block this IP
        attempt.blockedUntil = now + BLOCK_DURATION_MS;
        const retryAfter = Math.ceil(BLOCK_DURATION_MS / 1000);
        res.set('Retry-After', String(retryAfter));
        throw new BadRequestException(
          `Too many requests. Please try again in ${retryAfter} seconds.`
        );
      } else {
        attempt.count++;
      }
    } else {
      attempts.set(key, { count: 1, firstAttempt: now, blockedUntil: 0 });
    }

    next();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
