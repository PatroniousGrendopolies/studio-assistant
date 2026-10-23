export const runtime = "nodejs";

import { streamText, type UIMessage, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { loadRoom, loadSafetyRules } from "@/lib/content.ts";
import { assembleSystemPrompt } from "@/lib/prompt.ts";
import { checkSafetyRules } from "@/lib/safety.ts";
import { rateLimit, getClientIp } from "@/lib/rate-limit.ts";
import { upsertConversation, saveMessage, getActiveCorrections, generateTopic } from "@/lib/db.ts";

const MAX_BODY_BYTES = 100_000;
const MAX_MESSAGES = 50;
const MAX_TEXT_CHARS = 4_000;
const MAX_ID_CHARS = 100;

// The app is text-only. Accept only text parts so the AI SDK never fetches an
// attacker-supplied URL (file/image parts) server-side.
function validateMessages(messages: unknown): messages is UIMessage[] {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return false;
  }
  return messages.every((m) => {
    if (!m || typeof m !== "object") return false;
    const msg = m as Record<string, unknown>;
    if (msg.role !== "user" && msg.role !== "assistant") return false;
    if (typeof msg.content === "string" && !Array.isArray(msg.parts)) {
      return msg.content.length <= MAX_TEXT_CHARS;
    }
    return (
      Array.isArray(msg.parts) &&
      msg.parts.every(
        (p) =>
          p &&
          typeof p === "object" &&
          (p as { type?: unknown }).type === "text" &&
          typeof (p as { text?: unknown }).text === "string" &&
          (p as { text: string }).text.length <= MAX_TEXT_CHARS,
      )
    );
  });
}

export async function POST(req: Request) {
  try {
    return await handleChat(req);
  } catch (err) {
    console.error("Unhandled error in chat route:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

async function handleChat(req: Request) {
  // ---------------------------------------------------------------------------
  // Parse request body
  // ---------------------------------------------------------------------------

  let messages: UIMessage[];
  let roomId: string;
  let sessionId: string | undefined;

  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return new Response("Request too large", { status: 413 });
    }
    const body = JSON.parse(raw);
    messages = body.messages;
    roomId = body.roomId;
    sessionId = body.sessionId;
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  if (!roomId || typeof roomId !== "string" || roomId.length > MAX_ID_CHARS) {
    return new Response("Missing or invalid roomId", { status: 400 });
  }
  if (sessionId !== undefined && (typeof sessionId !== "string" || sessionId.length > MAX_ID_CHARS)) {
    return new Response("Invalid sessionId", { status: 400 });
  }
  if (!validateMessages(messages)) {
    return new Response("Invalid messages", { status: 400 });
  }

  // ---------------------------------------------------------------------------
  // Rate limit
  // ---------------------------------------------------------------------------

  const ip = getClientIp(req);

  const { success: withinLimit } = await rateLimit(ip);
  if (!withinLimit) {
    return new Response("Rate limit exceeded. Please try again later.", {
      status: 429,
    });
  }

  // ---------------------------------------------------------------------------
  // Persist conversation (graceful degradation — chat works without DB)
  // ---------------------------------------------------------------------------

  let conversationId: string | null = null;
  if (sessionId) {
    try {
      conversationId = await upsertConversation(sessionId, roomId);
    } catch (err) {
      console.error("Failed to upsert conversation:", err);
    }
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
  let userText = "";

  if (lastUserMessage) {
    // Handle both UIMessage formats: { parts: [...] } and { content: "..." }
    const msg = lastUserMessage as unknown as Record<string, unknown>;
    if (Array.isArray(msg.parts)) {
      userText = (msg.parts as Array<{ type?: string; text?: string }>)
        .filter((p) => p.type === "text" && p.text)
        .map((p) => p.text!)
        .join(" ");
    } else if (typeof msg.content === "string") {
      userText = msg.content;
    }

    const match = checkSafetyRules(userText, safetyRules.rules);
    if (match) {
      safetyPrefix = `\n\n[SAFETY RULE TRIGGERED — ${match.severity.toUpperCase()}]\nTrigger: ${match.trigger}\nWarning: ${match.warning}\n\nYou MUST address this safety warning prominently at the start of your response before providing any other guidance. Format the warning so it stands out visually (start with "⚠️ Warning:").`;
    }

    // Persist user message (graceful degradation)
    if (conversationId && userText) {
      try {
        await saveMessage(
          conversationId,
          "user",
          userText,
          match?.ruleId,
        );
      } catch (err) {
        console.error("Failed to save user message:", err);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Load corrections (graceful degradation)
  // ---------------------------------------------------------------------------

  let corrections;
  try {
    corrections = await getActiveCorrections(roomId);
  } catch (err) {
    console.error("Failed to load corrections:", err);
  }

  // ---------------------------------------------------------------------------
  // Build system prompt
  // ---------------------------------------------------------------------------

  const systemPrompt =
    assembleSystemPrompt(room, safetyRules, corrections) + safetyPrefix;

  // ---------------------------------------------------------------------------
  // Convert UI messages to model messages & stream
  // ---------------------------------------------------------------------------

  // Normalize messages: if they have `content` string instead of `parts` array,
  // convert to the parts format that convertToModelMessages expects
  const normalizedMessages = messages.map((m) => {
    const msg = m as unknown as Record<string, unknown>;
    if (!Array.isArray(msg.parts) && typeof msg.content === "string") {
      return { ...m, parts: [{ type: "text" as const, text: msg.content as string }] };
    }
    return m;
  });

  const modelMessages = await convertToModelMessages(normalizedMessages);

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: {
      role: "system" as const,
      content: systemPrompt,
      providerOptions: {
        anthropic: { cacheControl: { type: "ephemeral", ttl: "1h" } },
      },
    },
    messages: modelMessages,
    maxOutputTokens: 1500,
    // Defense in depth: never download remote files server-side
    experimental_download: async (requests) =>
      requests.map(() => {
        throw new Error("Remote file downloads are disabled");
      }),
    onFinish: async ({ text }) => {
      if (conversationId && text) {
        try {
          await saveMessage(conversationId, "assistant", text);
        } catch (err) {
          console.error("Failed to save assistant message:", err);
        }
        // Generate topic summary from the first user message (non-blocking)
        if (userText) {
          generateTopic(conversationId, userText).catch((err) =>
            console.error("Failed to generate topic:", err),
          );
        }
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
