// ---------------------------------------------------------------------------
// Rate limiter — gracefully degrades when Vercel KV is not configured
// ---------------------------------------------------------------------------

const WINDOW_SECONDS = 3600; // 1 hour
const MAX_REQUESTS = 50;

export async function rateLimit(
  ip: string,
): Promise<{ success: boolean; remaining: number }> {
  // Dev mode: if KV is not configured, skip rate limiting entirely
  if (!process.env.KV_REST_API_URL) {
    return { success: true, remaining: MAX_REQUESTS };
  }

  // Lazy-import @vercel/kv so the module doesn't throw when the env vars
  // are missing (the import itself tries to connect).
  const { kv } = await import("@vercel/kv");

  const key = `rate-limit:${ip}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - WINDOW_SECONDS;

  // Use a sorted set: score = timestamp, member = unique per request
  const member = `${now}:${crypto.randomUUID()}`;

  // Pipeline: add new entry, prune old entries, count current window
  const pipeline = kv.pipeline();
  pipeline.zadd(key, { score: now, member });
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zcard(key);
  pipeline.expire(key, WINDOW_SECONDS);

  const results = await pipeline.exec();

  // zcard result is the third command (index 2)
  const requestCount = (results[2] as number) ?? 0;
  const remaining = Math.max(0, MAX_REQUESTS - requestCount);

  return {
    success: requestCount <= MAX_REQUESTS,
    remaining,
  };
}
