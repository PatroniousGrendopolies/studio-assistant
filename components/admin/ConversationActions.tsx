"use client";

import { useState, useTransition } from "react";
import {
  flagMessage,
  resolveFlag,
  createCorrection,
} from "@/lib/admin-actions";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// FlagForm — shown below an unflagged assistant message
// ---------------------------------------------------------------------------

export function FlagForm({ messageId }: { messageId: string }) {
  const [open, setOpen] = useState(false);
  const [flagType, setFlagType] = useState("incorrect");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 text-xs text-gray-400 hover:text-black"
      >
        <svg
          className="mr-1 inline-block h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        Flag
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-center gap-2">
        <select
          value={flagType}
          onChange={(e) => setFlagType(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-xs"
        >
          <option value="incorrect">Incorrect</option>
          <option value="dangerous">Dangerous</option>
          <option value="unclear">Unclear</option>
          <option value="other">Other</option>
        </select>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        rows={2}
        className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2 text-xs outline-none focus:border-black"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await flagMessage(messageId, flagType, note);
              router.refresh();
              setOpen(false);
            });
          }}
          className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Submit Flag"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FlagActions — shown on a flagged message (resolve + create correction)
// ---------------------------------------------------------------------------

export function FlagActions({
  flagId,
  flagNote,
  messageContent,
  roomId,
}: {
  flagId: string;
  flagNote: string | null;
  messageContent: string;
  roomId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showCorrection, setShowCorrection] = useState(false);
  const router = useRouter();

  return (
    <div className="mt-2">
      {flagNote && (
        <p className="mb-2 text-xs text-amber-700">
          <span className="font-medium">Flag note:</span> {flagNote}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await resolveFlag(flagId);
              router.refresh();
            });
          }}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {isPending ? "Resolving..." : "Resolve"}
        </button>
        <button
          type="button"
          onClick={() => setShowCorrection(!showCorrection)}
          className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
        >
          Create Correction
        </button>
      </div>
      {showCorrection && (
        <CorrectionForm
          roomId={roomId}
          flagId={flagId}
          originalMessage={messageContent}
          onDone={() => setShowCorrection(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CorrectionForm — inline form for creating a correction
// ---------------------------------------------------------------------------

export function CorrectionForm({
  roomId,
  flagId,
  originalMessage,
  onDone,
}: {
  roomId: string;
  flagId?: string;
  originalMessage: string;
  onDone?: () => void;
}) {
  const [correction, setCorrection] = useState("");
  const [context, setContext] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
      <p className="mb-2 text-xs font-medium text-gray-600">Original message</p>
      <p className="mb-3 rounded-md bg-gray-50 p-2 text-xs text-gray-700">
        {originalMessage.length > 300
          ? originalMessage.slice(0, 300) + "..."
          : originalMessage}
      </p>

      <label className="mb-1 block text-xs font-medium text-gray-600">
        Correction
      </label>
      <textarea
        value={correction}
        onChange={(e) => setCorrection(e.target.value)}
        rows={3}
        className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-xs outline-none focus:border-black"
        placeholder="What should the assistant have said?"
      />

      <label className="mb-1 block text-xs font-medium text-gray-600">
        Context (optional)
      </label>
      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        rows={2}
        className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-xs outline-none focus:border-black"
        placeholder="When should this correction apply?"
      />

      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending || !correction.trim()}
          onClick={() => {
            startTransition(async () => {
              await createCorrection({
                roomId,
                flagId,
                originalMessage,
                correction,
                context: context || undefined,
              });
              router.refresh();
              onDone?.();
            });
          }}
          className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Correction"}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
