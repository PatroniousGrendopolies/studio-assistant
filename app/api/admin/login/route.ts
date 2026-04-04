export const runtime = "nodejs";

import { cookies } from "next/headers";
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/auth.ts";

const LOGIN_WINDOW_SECONDS = 3600;
const LOGIN_MAX_ATTEMPTS = 5;

async function loginRateLimit(ip: string): Promise<boolean> {
  if (!process.env.KV_REST_API_URL) return true;

  try {
    const { kv } = await import("@vercel/kv");
    const key = `rate-limit:admin-login:${ip}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - LOGIN_WINDOW_SECONDS;
    const member = `${now}:${crypto.randomUUID()}`;

    const pipeline = kv.pipeline();
    pipeline.zadd(key, { score: now, member });
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.expire(key, LOGIN_WINDOW_SECONDS);

    const results = await pipeline.exec();
    const count = (results[2] as number) ?? 0;
    return count <= LOGIN_MAX_ATTEMPTS;
  } catch {
    return true;
  }
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const withinLimit = await loginRateLimit(ip);
  if (!withinLimit) {
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

  if (!password || !verifyPassword(password)) {
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
