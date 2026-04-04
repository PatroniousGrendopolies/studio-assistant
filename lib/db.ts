import { createClient, isSupabaseConfigured } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Correction {
  id: string;
  room_id: string;
  flag_id: string | null;
  original_message: string;
  correction: string;
  context: string | null;
  active: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  session_id: string;
  room_id: string;
  started_at: string;
  topic: string | null;
  last_message_at: string | null;
  message_count: number;
  has_flags: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  safety_rule_triggered: string | null;
  created_at: string;
  flag: {
    id: string;
    flag_type: string;
    note: string | null;
    resolved_at: string | null;
  } | null;
}

interface Stats {
  totalConversations: number;
  todayConversations: number;
  openFlags: number;
  activeCorrections: number;
}

// ---------------------------------------------------------------------------
// Conversation persistence (called from chat route)
// ---------------------------------------------------------------------------

/**
 * Upsert a conversation row keyed by sessionId.
 * Returns the conversation UUID or null if Supabase is unavailable.
 */
export async function upsertConversation(
  sessionId: string,
  roomId: string,
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const sb = createClient();

  // Try to find existing conversation for this session
  const { data: existing } = await sb
    .from("conversations")
    .select("id")
    .eq("session_id", sessionId)
    .single();

  if (existing) return existing.id;

  // Create new conversation
  const { data, error } = await sb
    .from("conversations")
    .insert({ session_id: sessionId, room_id: roomId })
    .select("id")
    .single();

  if (error) throw error;
  return data?.id ?? null;
}

/**
 * Generate a brief topic summary for a conversation using Claude.
 * Called once after the first assistant response.
 */
export async function generateTopic(
  conversationId: string,
  userMessage: string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const sb = createClient();

  // Check if topic already exists
  const { data: conv } = await sb
    .from("conversations")
    .select("topic")
    .eq("id", conversationId)
    .single();

  if (conv?.topic) return;

  try {
    const { generateText } = await import("ai");
    const { anthropic } = await import("@ai-sdk/anthropic");

    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      prompt: `Summarize this studio user's question in 6 words or fewer. No punctuation. Examples: "Mic not picking up sound", "Setting up headphone mix", "Patchbay routing help needed"\n\nUser message: "${userMessage}"`,
    });

    const topic = text.trim().slice(0, 80);
    if (topic) {
      await sb
        .from("conversations")
        .update({ topic })
        .eq("id", conversationId);
    }
  } catch (err) {
    console.error("Failed to generate topic:", err);
  }
}

/**
 * Save a single message to the messages table.
 */
export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  safetyRuleId?: string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const sb = createClient();
  const { error } = await sb.from("messages").insert({
    conversation_id: conversationId,
    role,
    content,
    safety_rule_triggered: safetyRuleId ?? null,
  });

  if (error) throw error;

  // Update last_message_at for session length tracking
  await sb
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
}

// ---------------------------------------------------------------------------
// Corrections (called from chat route + admin)
// ---------------------------------------------------------------------------

/**
 * Get all active corrections for a room (injected into the system prompt).
 */
export async function getActiveCorrections(
  roomId: string,
): Promise<Correction[]> {
  if (!isSupabaseConfigured()) return [];

  const sb = createClient();
  const { data, error } = await sb
    .from("corrections")
    .select("*")
    .eq("room_id", roomId)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Correction[]) ?? [];
}

/**
 * Create a new correction from the admin dashboard.
 */
export async function createCorrection(input: {
  roomId: string;
  flagId?: string;
  originalMessage: string;
  correction: string;
  context?: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const sb = createClient();

  const { error } = await sb.from("corrections").insert({
    room_id: input.roomId,
    flag_id: input.flagId ?? null,
    original_message: input.originalMessage,
    correction: input.correction,
    context: input.context ?? null,
    active: true,
  });

  if (error) throw error;

  // If linked to a flag, resolve the flag
  if (input.flagId) {
    await resolveFlag(input.flagId);
  }
}

// ---------------------------------------------------------------------------
// Flagging (admin dashboard)
// ---------------------------------------------------------------------------

/**
 * Flag an assistant message for review.
 */
export async function flagMessage(
  messageId: string,
  flagType: string,
  note?: string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const sb = createClient();
  const { error } = await sb.from("flags").insert({
    message_id: messageId,
    flag_type: flagType,
    note: note || null,
  });

  if (error) throw error;
}

/**
 * Resolve a flag (mark as handled).
 */
export async function resolveFlag(flagId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const sb = createClient();
  const { error } = await sb
    .from("flags")
    .update({ resolved_at: new Date().toISOString() })
    .eq("id", flagId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Admin queries
// ---------------------------------------------------------------------------

/**
 * Dashboard stats.
 */
export async function getStats(): Promise<Stats> {
  if (!isSupabaseConfigured()) {
    return {
      totalConversations: 0,
      todayConversations: 0,
      openFlags: 0,
      activeCorrections: 0,
    };
  }

  const sb = createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [convos, todayConvos, flags, corrections] = await Promise.all([
    sb.from("conversations").select("id", { count: "exact", head: true }),
    sb
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .gte("started_at", today.toISOString()),
    sb
      .from("flags")
      .select("id", { count: "exact", head: true })
      .is("resolved_at", null),
    sb
      .from("corrections")
      .select("id", { count: "exact", head: true })
      .eq("active", true),
  ]);

  return {
    totalConversations: convos.count ?? 0,
    todayConversations: todayConvos.count ?? 0,
    openFlags: flags.count ?? 0,
    activeCorrections: corrections.count ?? 0,
  };
}

/**
 * List conversations with optional room filter.
 */
export async function listConversations(
  filter?: { roomId?: string },
): Promise<Conversation[]> {
  if (!isSupabaseConfigured()) return [];

  const sb = createClient();
  let query = sb
    .from("conversations_with_stats")
    .select("id, session_id, room_id, started_at, message_count, has_flags")
    .order("started_at", { ascending: false })
    .limit(100);

  if (filter?.roomId) {
    query = query.eq("room_id", filter.roomId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Conversation[]) ?? [];
}

/**
 * Get a single conversation with its messages and flags.
 */
export async function getConversation(
  id: string,
): Promise<{ conversation: Conversation; messages: Message[] } | null> {
  if (!isSupabaseConfigured()) return null;

  const sb = createClient();

  const { data: convRow, error: convError } = await sb
    .from("conversations")
    .select("id, session_id, room_id, started_at, topic, last_message_at")
    .eq("id", id)
    .single();

  if (convError || !convRow) return null;

  const { data: msgs, error: msgError } = await sb
    .from("messages")
    .select("id, conversation_id, role, content, safety_rule_triggered, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  if (msgError) throw msgError;
  const messages = msgs ?? [];

  // Fetch flags for all messages in one query
  const messageIds = messages.map((m) => m.id as string);
  const { data: flags } = messageIds.length > 0
    ? await sb.from("flags").select("*").in("message_id", messageIds)
    : { data: [] };

  const flagMap = new Map(
    (flags ?? []).map((f) => [f.message_id as string, f]),
  );

  const shaped: Message[] = messages.map((msg) => {
    const f = flagMap.get(msg.id as string);
    return {
      id: msg.id as string,
      conversation_id: msg.conversation_id as string,
      role: msg.role as "user" | "assistant",
      content: msg.content as string,
      safety_rule_triggered: (msg.safety_rule_triggered as string) ?? null,
      created_at: msg.created_at as string,
      flag: f
        ? {
            id: f.id as string,
            flag_type: f.flag_type as string,
            note: (f.note as string) ?? null,
            resolved_at: (f.resolved_at as string) ?? null,
          }
        : null,
    };
  });

  return {
    conversation: {
      id: convRow.id as string,
      session_id: convRow.session_id as string,
      room_id: convRow.room_id as string,
      started_at: convRow.started_at as string,
      topic: (convRow.topic as string) ?? null,
      last_message_at: (convRow.last_message_at as string) ?? null,
      message_count: messages.length,
      has_flags: (flags ?? []).length > 0,
    },
    messages: shaped,
  };
}

/**
 * List all corrections, optionally filtered by room.
 */
export async function listCorrections(
  roomId?: string,
): Promise<Correction[]> {
  if (!isSupabaseConfigured()) return [];

  const sb = createClient();
  let query = sb
    .from("corrections")
    .select("*")
    .order("created_at", { ascending: false });

  if (roomId) {
    query = query.eq("room_id", roomId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Correction[]) ?? [];
}

/**
 * Toggle a correction active/inactive.
 */
export async function toggleCorrection(
  correctionId: string,
  active: boolean,
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const sb = createClient();
  const { error } = await sb
    .from("corrections")
    .update({ active })
    .eq("id", correctionId);

  if (error) throw error;
}
