export const runtime = "nodejs";

import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth.ts";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return new Response("OK", { status: 200 });
}
