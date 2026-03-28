export const runtime = "nodejs";

import { streamText, type UIMessage, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { loadRoom, loadSafetyRules } from "@/lib/content.ts";
import { assembleSystemPrompt } from "@/lib/prompt.ts";
import { checkSafetyRules } from "@/lib/safety.ts";
import { rateLimit } from "@/lib/rate-limit.ts";

export async function POST(req: Request) {
  // ---------------------------------------------------------------------------
  // Parse request body
  // ---------------------------------------------------------------------------

  let messages: UIMessage[];
  let roomId: string;

  try {
    const body = await req.json();
    messages = body.messages;
    roomId = body.roomId;
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  if (!roomId || typeof roomId !== "string") {
    return new Response("Missing or invalid roomId", { status: 400 });
  }

  // ---------------------------------------------------------------------------
  // Rate limit
  // ---------------------------------------------------------------------------

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { success: withinLimit } = await rateLimit(ip);
  if (!withinLimit) {
    return new Response("Rate limit exceeded. Please try again later.", {
      status: 429,
    });
  }

  // ---------------------------------------------------------------------------
  // Load room content & safety rules
  // ---------------------------------------------------------------------------

  let room;
  try {
    room = loadRoom(roomId);
  } catch {
    return new Response(`Unknown room: ${roomId}`, { status: 400 });
  }

  let safetyRules;
  try {
    safetyRules = loadSafetyRules();
  } catch (err) {
    console.error("Failed to load safety rules:", err);
    return new Response("Internal server error", { status: 500 });
  }

  // ---------------------------------------------------------------------------
  // Safety pre-scan on the last user message
  // ---------------------------------------------------------------------------

  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");

  let safetyPrefix = "";

  if (lastUserMessage) {
    const userText = lastUserMessage.parts
      .filter(
        (p): p is { type: "text"; text: string } => p.type === "text",
      )
      .map((p) => p.text)
      .join(" ");

    const match = checkSafetyRules(userText, safetyRules.rules);
    if (match) {
      safetyPrefix = `\n\n[SAFETY RULE TRIGGERED — ${match.severity.toUpperCase()}]\nTrigger: ${match.trigger}\nWarning: ${match.warning}\n\nYou MUST address this safety warning prominently at the start of your response before providing any other guidance. Format the warning so it stands out visually (start with "⚠️ Warning:").`;
    }
  }

  // ---------------------------------------------------------------------------
  // Build system prompt
  // ---------------------------------------------------------------------------

  const systemPrompt = assembleSystemPrompt(room, safetyRules) + safetyPrefix;

  // ---------------------------------------------------------------------------
  // Convert UI messages to model messages & stream
  // ---------------------------------------------------------------------------

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
