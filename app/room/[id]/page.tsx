"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { UIMessage } from "ai";
import VoiceInput from "@/components/VoiceInput";

// ---------------------------------------------------------------------------
// Symptom categories (hardcoded to avoid an extra API call)
// ---------------------------------------------------------------------------

const SYMPTOM_CATEGORIES = [
  {
    id: "no-sound",
    label: "No sound",
    icon: "volume-x",
    message: "I'm not getting any sound at all.",
  },
  {
    id: "mic-not-working",
    label: "Mic not working",
    icon: "mic-off",
    message: "My microphone doesn't seem to be working.",
  },
  {
    id: "cant-hear-myself",
    label: "Can't hear myself",
    icon: "headphones",
    message: "I can't hear myself in my headphones.",
  },
  {
    id: "something-wrong",
    label: "Something looks wrong",
    icon: "alert-triangle",
    message: "Something doesn't look right with the equipment.",
  },
  {
    id: "cable-issue",
    label: "Cable / connection",
    icon: "cable",
    message: "I think there might be a cable or connection problem.",
  },
  {
    id: "dont-know",
    label: "I don't know where to start",
    icon: "help-circle",
    message: "I'm new here and don't know where to begin setting up.",
  },
] as const;

// ---------------------------------------------------------------------------
// Simple icon map (inline SVG to avoid a dependency)
// ---------------------------------------------------------------------------

function SymptomIcon({ icon }: { icon: string }) {
  const cls = "h-6 w-6 shrink-0";
  switch (icon) {
    case "volume-x":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      );
    case "mic-off":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .67-.1 1.32-.27 1.93" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      );
    case "headphones":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z" />
        </svg>
      );
    case "alert-triangle":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "cable":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1" />
          <path d="M19 15V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V9" />
          <path d="M21 21v-2h-4" />
          <path d="M3 5v-2a1 1 0 0 1 1-1h1a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1" />
          <path d="M3 3v2h4" />
        </svg>
      );
    case "help-circle":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isSafetyWarning(text: string): boolean {
  return (
    text.startsWith("\u26A0\uFE0F") ||
    text.includes("SAFETY WARNING") ||
    text.includes("Warning:")
  );
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function FormattedText({ text }: { text: string }) {
  // Split into lines, render each with inline markdown
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          <InlineMarkdown line={line} />
        </span>
      ))}
    </>
  );
}

function InlineMarkdown({ line }: { line: string }) {
  // Parse **bold** and *italic* into spans
  const parts: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
      }
      parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }
    // No more matches, push the rest
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return <>{parts}</>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChatPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const [showSymptoms, setShowSymptoms] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { roomId },
      }),
    [roomId],
  );

  const { messages, sendMessage, status } = useChat({
    id: `chat-${roomId}`,
    transport,
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea to fit content
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, [inputValue]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isStreaming) return;
    setInputValue("");
    setShowSymptoms(false);
    sendMessage({ text });
  }

  function handleSymptomTap(message: string) {
    setShowSymptoms(false);
    setInputValue("");
    sendMessage({ text: message });
  }

  // Format room ID for display (e.g. "room-a" -> "Room A")
  const roomDisplayName = roomId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="flex h-dvh flex-col bg-white text-black">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-base font-bold uppercase tracking-wide text-black">{roomDisplayName}</h1>
        <a
          href="tel:+15146798761"
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-500 active:bg-amber-700"
        >
          Get Staff Help
        </a>
      </header>

      {/* Chat thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-sm text-[#303133]">
              Send a message to get started, or tap{" "}
              <span className="font-medium text-black">
                &quot;I don&apos;t know what to say&quot;
              </span>{" "}
              below.
            </p>
          </div>
        )}

        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {messages.map((message) => {
            const text = getMessageText(message);
            if (!text) return null;

            const isUser = message.role === "user";
            const isSafety = !isUser && isSafetyWarning(text);

            return (
              <div
                key={message.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? "bg-black text-white"
                      : isSafety
                        ? "border-2 border-amber-500/60 bg-amber-50 text-amber-900"
                        : "bg-[#f5f5f5] text-black"
                  }`}
                >
                  {isSafety && (
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      Safety Warning
                    </div>
                  )}
                  <FormattedText text={text} />
                </div>
              </div>
            );
          })}

          {isStreaming && messages.at(-1)?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-[#f5f5f5] px-4 py-2.5 text-sm text-[#303133]">
                <span className="inline-flex gap-1">
                  <span className="animate-pulse">.</span>
                  <span className="animate-pulse delay-100">.</span>
                  <span className="animate-pulse delay-200">.</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Symptom picker */}
      {showSymptoms && (
        <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-4">
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-2">
            {SYMPTOM_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSymptomTap(cat.message)}
                className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-3 text-left text-sm text-[#303133] transition-colors hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100"
              >
                <SymptomIcon icon={cat.icon} />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSymptoms((v) => !v)}
            className="shrink-0 rounded-full border border-gray-300 p-2 text-[#303133] transition-colors hover:border-gray-500 hover:text-black"
            title="I don't know what to say"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>

          <form onSubmit={handleSubmit} className="flex flex-1 items-end gap-2">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Describe your issue..."
              rows={1}
              className="flex-1 resize-none overflow-hidden rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-black placeholder-gray-400 outline-none transition-colors focus:border-gray-500"
              disabled={isStreaming}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isStreaming}
              className="shrink-0 rounded-full bg-black p-2.5 text-white transition-opacity disabled:opacity-30"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>

          <VoiceInput
            onTranscript={(text) => setInputValue(text)}
            disabled={isStreaming}
          />
        </div>
      </div>
    </div>
  );
}
