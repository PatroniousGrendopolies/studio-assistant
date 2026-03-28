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
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    setSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Send whatever we've accumulated
    const text = transcriptRef.current.trim();
    if (text) {
      onTranscript(text);
      transcriptRef.current = "";
    }
  }, [onTranscript]);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    transcriptRef.current = "";
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionType) => {
      // Build transcript from all results
      let full = "";
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript;
      }
      transcriptRef.current = full;

      // Reset the silence timeout on every result
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        // 2 seconds of silence after last speech = done
        recognition.stop();
      }, 2000);
    };

    recognition.onerror = (event: SpeechRecognitionType) => {
      // "no-speech" and "aborted" are not real errors, just user didn't speak
      if (event.error === "no-speech" || event.error === "aborted") {
        setListening(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        return;
      }
      setListening(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    recognition.onend = () => {
      setListening(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Send accumulated transcript
      const text = transcriptRef.current.trim();
      if (text) {
        onTranscript(text);
        transcriptRef.current = "";
      }
    };

    // 15-second max recording time
    timeoutRef.current = setTimeout(() => {
      recognition.stop();
    }, 15000);

    recognition.start();
    setListening(true);
  }, [onTranscript]);

  const toggle = useCallback(() => {
    if (listening) {
      stop();
    } else {
      start();
    }
  }, [listening, start, stop]);

  if (supported === null || supported === false) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      className={`flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-30 ${
        listening
          ? "animate-pulse bg-red-600 text-white"
          : "bg-gray-100 text-[#303133] hover:bg-gray-200"
      }`}
      title={listening ? "Stop recording" : "Voice input"}
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
        {listening ? (
          // Stop icon (square) when recording
          <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
        ) : (
          // Mic icon when idle
          <>
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </>
        )}
      </svg>
    </button>
  );
}
