/**
 * Rate limiting utilities
 * 
 * This implementation uses an in-memory store for simplicity.
 * For production with multiple instances, use Redis (Upstash or Vercel KV)
 */

interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Max requests per window
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for a given identifier
 */
export async function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const now = Date.now();
    const key = identifier;

    // Clean up expired entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
        cleanExpiredEntries(now);
    }

    const record = rateLimitStore.get(key);

    // No record or expired
    if (!record || now > record.resetTime) {
        const resetTime = now + config.windowMs;
        rateLimitStore.set(key, { count: 1, resetTime });

        return {
            success: true,
            limit: config.maxRequests,
            remaining: config.maxRequests - 1,
            reset: resetTime,
        };
    }

    // Increment counter
    record.count++;
    rateLimitStore.set(key, record);

    // Check if limit exceeded
    if (record.count > config.maxRequests) {
        return {
            success: false,
            limit: config.maxRequests,
            remaining: 0,
            reset: record.resetTime,
        };
    }

    return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - record.count,
        reset: record.resetTime,
    };
}

/**
 * Clean up expired entries from store
 */
function cleanExpiredEntries(now: number): void {
    rateLimitStore.forEach((record, key) => {
        if (now > record.resetTime) {
            rateLimitStore.delete(key);
        }
    });
}

/**
 * Rate limit by IP address
 */
export async function rateLimitByIP(
    ip: string,
    config: RateLimitConfig = { windowMs: 60000, maxRequests: 60 }
): Promise<RateLimitResult> {
    return checkRateLimit(`ip:${ip}`, config);
}

/**
 * Rate limit by user ID
 */
export async function rateLimitByUser(
    userId: string,
    config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
): Promise<RateLimitResult> {
    return checkRateLimit(`user:${userId}`, config);
}

/**
 * Rate limit by custom identifier
 */
export async function rateLimitByIdentifier(
    identifier: string,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    return checkRateLimit(identifier, config);
}

/**
 * Combined rate limiting (IP + User)
 */
export async function rateLimitCombined(
    ip: string,
    userId?: string,
    options?: {
        ipConfig?: RateLimitConfig;
        userConfig?: RateLimitConfig;
    }
): Promise<RateLimitResult> {
    // Check IP rate limit first
    const ipResult = await rateLimitByIP(ip, options?.ipConfig);
    if (!ipResult.success) {
        return ipResult;
    }

    // If user is authenticated, check user rate limit
    if (userId) {
        const userResult = await rateLimitByUser(userId, options?.userConfig);
        if (!userResult.success) {
            return userResult;
        }
    }

    return ipResult; // Return IP result if both passed
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.reset / 1000).toString(),
    };
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
    // Strict limits for anonymous/sensitive endpoints
    STRICT: { windowMs: 60000, maxRequests: 10 }, // 10 per minute

    // Standard API limits
    STANDARD: { windowMs: 60000, maxRequests: 60 }, // 60 per minute

    // Relaxed limits for authenticated users
    RELAXED: { windowMs: 60000, maxRequests: 100 }, // 100 per minute

    // Payment endpoints (extra strict)
    PAYMENT: { windowMs: 300000, maxRequests: 5 }, // 5 per 5 minutes

    // Upload endpoints
    UPLOAD: { windowMs: 60000, maxRequests: 10 }, // 10 per minute

    // Webhook endpoints (high volume)
    WEBHOOK: { windowMs: 60000, maxRequests: 1000 }, // 1000 per minute
} as const;

/* 
 * PRODUCTION IMPLEMENTATION WITH REDIS/VERCEL KV
 * 
 * Uncomment and configure when using Vercel KV or Upstash Redis:
 * 
 * import { kv } from '@vercel/kv';
 * 
 * export async function checkRateLimitRedis(
 *   identifier: string,
 *   config: RateLimitConfig
 * ): Promise<RateLimitResult> {
 *   const key = `ratelimit:${identifier}`;
 *   const now = Date.now();
 *   
 *   // Use Redis sorted set for sliding window
 *   const windowStart = now - config.windowMs;
 *   
 *   // Remove old entries
 *   await kv.zremrangebyscore(key, 0, windowStart);
 *   
 *   // Count requests in current window
 *   const count = await kv.zcard(key);
 *   
 *   if (count >= config.maxRequests) {
 *     const oldestRequest = await kv.zrange(key, 0, 0, { withScores: true });
 *     const resetTime = oldestRequest[1] + config.windowMs;
 *     
 *     return {
 *       success: false,
 *       limit: config.maxRequests,
 *       remaining: 0,
 *       reset: resetTime,
 *     };
 *   }
 *   
 *   // Add current request
 *   await kv.zadd(key, { score: now, member: `${now}:${Math.random()}` });
 *   await kv.expire(key, Math.ceil(config.windowMs / 1000));
 *   
 *   return {
 *     success: true,
 *     limit: config.maxRequests,
 *     remaining: config.maxRequests - (count + 1),
 *     reset: now + config.windowMs,
 *   };
 * }
 */
