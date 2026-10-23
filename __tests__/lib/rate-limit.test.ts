import { describe, test, expect } from "bun:test";
import { memoryRateLimit, rateLimit, getClientIp } from "../../lib/rate-limit.ts";

describe("rate limiter without KV", () => {
  test("memoryRateLimit blocks after max", () => {
    const key = `t:${crypto.randomUUID()}`;
    for (let i = 0; i < 3; i++) expect(memoryRateLimit(key, 3, 60).success).toBe(true);
    expect(memoryRateLimit(key, 3, 60).success).toBe(false);
  });

  test("rateLimit does not fail open when KV_REST_API_URL is unset", async () => {
    delete process.env.KV_REST_API_URL;
    const ip = `ip-${crypto.randomUUID()}`;
    let blocked = false;
    for (let i = 0; i < 60; i++) {
      if (!(await rateLimit(ip)).success) blocked = true;
    }
    expect(blocked).toBe(true);
  });

  test("IPv6 addresses collapse to /64", () => {
    const a = new Request("http://x", { headers: { "x-forwarded-for": "2001:db8:1:2:aaaa::1" } });
    const b = new Request("http://x", { headers: { "x-forwarded-for": "2001:db8:1:2::ffff" } });
    expect(getClientIp(a)).toBe(getClientIp(b));
  });
});
