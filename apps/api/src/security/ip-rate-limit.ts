import type { NextFunction, Request, Response } from 'express';

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  message: string;
};

type Bucket = {
  count: number;
  resetAt: number;
};

/**
 * Small, per-process IP rate limiter for sensitive endpoints.
 * For multi-instance production deployments, replace the in-memory store
 * with a shared atomic store (for example Redis).
 */
export function createIpRateLimit(
  options: RateLimitOptions,
  now: () => number = Date.now,
) {
  if (options.windowMs <= 0 || options.maxRequests < 1) {
    throw new Error('Rate limit window and request count must be positive');
  }

  const buckets = new Map<string, Bucket>();

  return (request: Request, response: Response, next: NextFunction) => {
    const currentTime = now();
    const key = request.ip || request.socket.remoteAddress || 'unknown';
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= currentTime) {
      bucket = { count: 0, resetAt: currentTime + options.windowMs };
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    // Bound memory usage if an endpoint is reached from many distinct addresses.
    if (buckets.size > 10_000) {
      for (const [address, entry] of buckets) {
        if (entry.resetAt <= currentTime) buckets.delete(address);
      }
      while (buckets.size > 10_000) {
        const oldestKey = buckets.keys().next().value;
        if (oldestKey === undefined) break;
        buckets.delete(oldestKey);
      }
    }

    const remaining = Math.max(0, options.maxRequests - bucket.count);
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - currentTime) / 1000));

    response.setHeader('RateLimit-Limit', String(options.maxRequests));
    response.setHeader('RateLimit-Remaining', String(remaining));
    response.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > options.maxRequests) {
      response.setHeader('Retry-After', String(retryAfterSeconds));
      response.status(429).json({
        statusCode: 429,
        message: options.message,
        retryAfterSeconds,
      });
      return;
    }

    next();
  };
}
