// ---------------------------------------------------------------------------
// Rate limiter — Vercel KV when configured, otherwise a best-effort in-memory
// per-instance limiter. It never fails open: a missing or failing KV falls
// back to the in-memory limiter.
// ---------------------------------------------------------------------------

const WINDOW_SECONDS = 3600; // 1 hour
const MAX_REQUESTS = 50;

// ---------------------------------------------------------------------------
// Client IP — collapses IPv6 addresses to their /64 so rotating within a
// prefix does not yield a fresh bucket
// ---------------------------------------------------------------------------

export function getClientIp(req: Request): string {
  const raw =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  if (raw.includes(":") && !raw.includes(".")) {
    const [head] = raw.split("::");
    return head!.split(":").slice(0, 4).join(":") || raw;
  }
  return raw;
}

// ---------------------------------------------------------------------------
// In-memory sliding-window limiter (per server instance, best effort)
// ---------------------------------------------------------------------------

const memoryHits = new Map<string, number[]>();
const MAX_TRACKED_KEYS = 10_000;

export function memoryRateLimit(
  key: string,
  max: number,
  windowSeconds: number,
  { record = true }: { record?: boolean } = {},
): { success: boolean; remaining: number } {
  const now = Date.now();
  const cutoff = now - windowSeconds * 1000;
  const hits = (memoryHits.get(key) ?? []).filter((t) => t > cutoff);
  if (record) hits.push(now);

  if (hits.length === 0) {
    memoryHits.delete(key);
  } else {
    memoryHits.set(key, hits);
  }

  // Bound memory: drop the oldest keys if an attacker rotates identifiers
  if (memoryHits.size > MAX_TRACKED_KEYS) {
    for (const k of memoryHits.keys()) {
      memoryHits.delete(k);
      if (memoryHits.size <= MAX_TRACKED_KEYS) break;
    }
  }

  return { success: hits.length <= max, remaining: Math.max(0, max - hits.length) };
}

export async function rateLimit(
  ip: string,
): Promise<{ success: boolean; remaining: number }> {
  // No KV configured: fall back to the in-memory limiter (never fail open)
  if (!process.env.KV_REST_API_URL) {
    return memoryRateLimit(`chat:${ip}`, MAX_REQUESTS, WINDOW_SECONDS);
  }

  try {
    return await kvRateLimit(ip);
  } catch (err) {
    console.error("KV rate limit failed, using in-memory limiter:", err);
    return memoryRateLimit(`chat:${ip}`, MAX_REQUESTS, WINDOW_SECONDS);
  }
}

async function kvRateLimit(
  ip: string,
): Promise<{ success: boolean; remaining: number }> {

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
