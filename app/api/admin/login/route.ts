export const runtime = "nodejs";

import { cookies } from "next/headers";
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/auth.ts";
import { getClientIp, memoryRateLimit } from "@/lib/rate-limit.ts";

const LOGIN_WINDOW_SECONDS = 15 * 60;
const LOGIN_MAX_FAILURES = 5;
const FAILURE_DELAY_MS = 750;

// Counts failed attempts only. KV when configured; otherwise (or if KV
// errors) an in-memory per-instance counter. Never fails open.
async function loginBlocked(ip: string): Promise<boolean> {
  const memKey = `admin-login:${ip}`;
  if (process.env.KV_REST_API_URL) {
    try {
      const { kv } = await import("@vercel/kv");
      const key = `rate-limit:admin-login:${ip}`;
      const now = Math.floor(Date.now() / 1000);
      const results = await kv
        .pipeline()
        .zremrangebyscore(key, 0, now - LOGIN_WINDOW_SECONDS)
        .zcard(key)
        .exec();
      if (((results[1] as number) ?? 0) >= LOGIN_MAX_FAILURES) return true;
    } catch (err) {
      console.error("KV login limit check failed:", err);
    }
  }
  return !memoryRateLimit(memKey, LOGIN_MAX_FAILURES - 1, LOGIN_WINDOW_SECONDS, {
    record: false,
  }).success;
}

async function recordLoginFailure(ip: string): Promise<void> {
  memoryRateLimit(`admin-login:${ip}`, LOGIN_MAX_FAILURES, LOGIN_WINDOW_SECONDS);
  if (!process.env.KV_REST_API_URL) return;
  try {
    const { kv } = await import("@vercel/kv");
    const key = `rate-limit:admin-login:${ip}`;
    const now = Math.floor(Date.now() / 1000);
    const pipeline = kv.pipeline();
    pipeline.zadd(key, { score: now, member: `${now}:${crypto.randomUUID()}` });
    pipeline.expire(key, LOGIN_WINDOW_SECONDS);
    await pipeline.exec();
  } catch (err) {
    console.error("KV login failure record failed:", err);
  }
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  if (await loginBlocked(ip)) {
    return new Response("Too many login attempts. Try again later.", {
      status: 429,
    });
  }

  let password: string;
  try {
    const body = await req.json();
    password = body.password;
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  if (typeof password !== "string" || !password || !verifyPassword(password)) {
    await recordLoginFailure(ip);
    await new Promise((r) => setTimeout(r, FAILURE_DELAY_MS));
    return new Response("Incorrect password", { status: 401 });
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return new Response("OK", { status: 200 });
}
