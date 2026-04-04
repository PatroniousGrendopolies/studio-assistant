import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import {
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "../../lib/auth.ts";

// ---------------------------------------------------------------------------
// Environment setup
// ---------------------------------------------------------------------------

const TEST_PASSWORD = "test-password-123";
const TEST_SECRET = "test-secret-key-for-hmac";

let originalPassword: string | undefined;
let originalSecret: string | undefined;

beforeEach(() => {
  originalPassword = process.env.ADMIN_PASSWORD;
  originalSecret = process.env.SESSION_SECRET;
  process.env.ADMIN_PASSWORD = TEST_PASSWORD;
  process.env.SESSION_SECRET = TEST_SECRET;
});

afterEach(() => {
  if (originalPassword !== undefined) {
    process.env.ADMIN_PASSWORD = originalPassword;
  } else {
    delete process.env.ADMIN_PASSWORD;
  }
  if (originalSecret !== undefined) {
    process.env.SESSION_SECRET = originalSecret;
  } else {
    delete process.env.SESSION_SECRET;
  }
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe("auth constants", () => {
  test("SESSION_COOKIE_NAME is 'admin_session'", () => {
    expect(SESSION_COOKIE_NAME).toBe("admin_session");
  });

  test("SESSION_MAX_AGE is 604800 (7 days)", () => {
    expect(SESSION_MAX_AGE).toBe(604800);
  });
});

// ---------------------------------------------------------------------------
// verifyPassword
// ---------------------------------------------------------------------------

describe("verifyPassword", () => {
  test("correct password returns true", () => {
    expect(verifyPassword(TEST_PASSWORD)).toBe(true);
  });

  test("wrong password returns false", () => {
    expect(verifyPassword("wrong-password")).toBe(false);
  });

  test("empty password returns false", () => {
    expect(verifyPassword("")).toBe(false);
  });

  test("missing ADMIN_PASSWORD env var returns false", () => {
    delete process.env.ADMIN_PASSWORD;
    expect(verifyPassword("anything")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createSessionToken
// ---------------------------------------------------------------------------

describe("createSessionToken", () => {
  test("returns a string with a dot separator", async () => {
    const token = await createSessionToken();
    expect(typeof token).toBe("string");
    expect(token).toContain(".");
    const parts = token.split(".");
    expect(parts.length).toBe(2);
    // Both parts should be non-empty base64 strings
    expect(parts[0]!.length).toBeGreaterThan(0);
    expect(parts[1]!.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// verifySessionToken
// ---------------------------------------------------------------------------

describe("verifySessionToken", () => {
  test("valid token returns true", async () => {
    const token = await createSessionToken();
    const result = await verifySessionToken(token);
    expect(result).toBe(true);
  });

  test("tampered token returns false", async () => {
    const token = await createSessionToken();
    // Flip a character in the signature portion
    const parts = token.split(".");
    const tampered = parts[0] + "." + parts[1]!.slice(0, -1) + "X";
    const result = await verifySessionToken(tampered);
    expect(result).toBe(false);
  });

  test("expired token returns false", async () => {
    // Manually build a token with an expiry in the past using the same
    // HMAC-SHA256 signing approach the module uses.
    const payload = JSON.stringify({
      role: "admin",
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    });
    const payloadB64 = Buffer.from(payload).toString("base64");

    // Sign with the same secret
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(TEST_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payloadB64),
    );
    const sigB64 = Buffer.from(sig).toString("base64");

    const expiredToken = `${payloadB64}.${sigB64}`;
    const result = await verifySessionToken(expiredToken);
    expect(result).toBe(false);
  });

  test("empty token returns false", async () => {
    expect(await verifySessionToken("")).toBe(false);
  });

  test("undefined/missing token returns false", async () => {
    // @ts-expect-error — intentionally testing bad input
    expect(await verifySessionToken(undefined)).toBe(false);
  });

  test("malformed token (no dot) returns false", async () => {
    expect(await verifySessionToken("nodothere")).toBe(false);
  });

  test("malformed token (invalid base64) returns false", async () => {
    expect(await verifySessionToken("!!!.???")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Round-trip
// ---------------------------------------------------------------------------

describe("round-trip", () => {
  test("createSessionToken -> verifySessionToken returns true", async () => {
    const token = await createSessionToken();
    expect(await verifySessionToken(token)).toBe(true);
  });
});
