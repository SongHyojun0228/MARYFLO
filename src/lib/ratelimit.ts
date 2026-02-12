import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiter for public-facing endpoints (inquiry form).
 * Sliding window: 5 requests per 60 seconds per identifier (IP).
 *
 * When UPSTASH_REDIS_REST_URL is not configured (local dev),
 * rate limiting is skipped.
 */
function createRatelimit() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: true,
    prefix: "mariflo:ratelimit",
  });
}

export const ratelimit = createRatelimit();

/**
 * Extract client IP from request headers.
 * Vercel sets x-forwarded-for; fallback to x-real-ip or "unknown".
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}
