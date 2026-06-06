import 'server-only';
import { NextRequest } from 'next/server';
import { LRUCache } from 'lru-cache';

// In-memory cache for rate limit tracking
// Max 10,000 unique keys, automatically prune entries older than 1 hour
const cache = new LRUCache<string, number[]>({
  max: 10000,
  ttl: 60 * 60 * 1000,
});

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Basic in-memory sliding window rate limiter.
 * In a multi-server setup, this would be replaced with Redis/Vercel KV.
 */
export async function rateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const { key, limit, windowMs } = params;
  const now = Date.now();
  
  const timestamps = cache.get(key) || [];
  
  // Filter out timestamps outside the sliding window
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);
  
  if (validTimestamps.length >= limit) {
    const oldest = validTimestamps[0];
    const resetTime = oldest + windowMs;
    return {
      success: false,
      limit,
      remaining: 0,
      reset: resetTime,
    };
  }
  
  validTimestamps.push(now);
  cache.set(key, validTimestamps);
  
  return {
    success: true,
    limit,
    remaining: limit - validTimestamps.length,
    reset: now + windowMs,
  };
}

/**
 * Extracts the client IP address from request headers.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}
