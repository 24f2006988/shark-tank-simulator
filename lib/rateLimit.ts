export interface RateLimiter {
  /** Returns 0 if allowed, otherwise the seconds to wait. */
  take(key: string): number;
}

/** In-memory token bucket per key. Good enough per Cloud Run instance to protect the Gemini quota. */
export function createRateLimiter(capacity: number, perMinute: number, now: () => number = Date.now): RateLimiter {
  const buckets = new Map<string, { tokens: number; at: number }>();
  const refillPerMs = perMinute / 60_000;
  return {
    take(key) {
      const t = now();
      if (buckets.size > 10_000) buckets.clear();
      const b = buckets.get(key) ?? { tokens: capacity, at: t };
      b.tokens = Math.min(capacity, b.tokens + (t - b.at) * refillPerMs);
      b.at = t;
      buckets.set(key, b);
      if (b.tokens >= 1) {
        b.tokens -= 1;
        return 0;
      }
      return Math.ceil((1 - b.tokens) / refillPerMs / 1000);
    },
  };
}

/**
 * Cloud Run's front end appends the address it saw to X-Forwarded-For, after anything the client sent.
 * Only that last entry is trustworthy; keying on the first would let a caller pick a fresh key per request.
 */
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
}
