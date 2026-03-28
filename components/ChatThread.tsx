"use client";

import type { UIMessage } from "ai";
import { useEffect, useRef } from "react";

interface ChatThreadProps {
  messages: UIMessage[];
  isLoading: boolean;
}

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

/** Lightweight markdown-ish formatting: bold, line breaks, numbered lists. */
function formatText(text: string): React.ReactNode[] {
  // Split by **bold** segments first
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ChatThread({ messages, isLoading }: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages change or loading state changes
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4">
      {messages.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <p className="text-center text-sm text-[#303133]">
            How can I help you today?
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
                      className="h-4 w-4 shrink-0"
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
                {formatText(text)}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-[#f5f5f5] px-4 py-2.5 text-sm text-[#303133]">
              <span className="inline-flex gap-1">
                <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
