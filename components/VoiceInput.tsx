"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionType = any;

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

function getSpeechRecognitionCtor(): SpeechRecognitionType | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect support after mount (window is available)
  useEffect(() => {
    setSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Auto-hide error tooltip after 2 seconds
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(false), 2000);
    return () => clearTimeout(id);
  }, [error]);

  const toggle = useCallback(() => {
    // If already listening, stop
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    let gotResult = false;

    recognition.onresult = (event: SpeechRecognitionType) => {
      gotResult = true;
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        onTranscript(transcript);
      } else {
        setError(true);
      }
    };

    recognition.onerror = () => {
      setListening(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setError(true);
    };

    recognition.onend = () => {
      setListening(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (!gotResult) {
        setError(true);
      }
    };

    // 5-second timeout
    timeoutRef.current = setTimeout(() => {
      recognition.stop();
    }, 5000);

    recognition.start();
    setListening(true);
  }, [listening, onTranscript]);

  // Don't render until we know support status; render null if unsupported
  if (supported === null || supported === false) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={`flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-30 ${
          listening
            ? "animate-pulse bg-red-600 text-white"
            : "bg-neutral-800 text-white hover:bg-neutral-700"
        }`}
        title="Voice input"
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
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>

      {error && (
        <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-neutral-700 px-3 py-1.5 text-xs text-neutral-200 shadow-lg">
          Voice didn&apos;t catch that
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-neutral-700" />
        </div>
      )}
    </div>
  );
}
