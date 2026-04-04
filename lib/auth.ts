import { cookies } from "next/headers";

// ---------------------------------------------------------------------------
// Admin auth — single-user password + HMAC-signed session cookie
// ---------------------------------------------------------------------------

export const SESSION_COOKIE_NAME = "admin_session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// ---------------------------------------------------------------------------
// Password verification (timing-safe)
// ---------------------------------------------------------------------------

export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !password) return false;

  // Use Node.js crypto.timingSafeEqual for constant-time comparison
  const { timingSafeEqual } = require("crypto") as typeof import("crypto");
  const a = Buffer.from(password);
  const b = Buffer.from(expected);

  if (a.byteLength !== b.byteLength) return false;
  return timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// Session token (HMAC-SHA256)
// ---------------------------------------------------------------------------

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET");

  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(): Promise<string> {
  const key = await getKey();
  const payload = JSON.stringify({
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  });

  const payloadB64 = btoa(payload);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64),
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${payloadB64}.${sigB64}`;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  if (!token || !token.includes(".")) return false;

  try {
    const parts = token.split(".");
    const payloadB64 = parts[0]!;
    const sigB64 = parts[1]!;
    const key = await getKey();

    const sigBytes = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(payloadB64),
    );

    if (!valid) return false;

    const payload = JSON.parse(atob(payloadB64)) as { role?: string; exp?: number };
    if (payload.role !== "admin") return false;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return false;

    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Require admin — for server actions
// ---------------------------------------------------------------------------

export async function requireAdmin(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token || !(await verifySessionToken(token))) {
    throw new Error("Unauthorized");
  }
}
